import express from "express";
import path from "path";
import fs from "fs";
import schedule from "node-schedule";
import WorkerPool, { EvalResult } from "./WorkerPool";
import ChatsoundsFetcher from "./ChatsoundsFetcher";
import log from "./log";

const BASE_PATH: string = "../../";
const configPath: string = path.resolve(__dirname, BASE_PATH, "config.json");
if (!fs.existsSync(configPath)) {
	throw new Error(`Could not start app: The config file is inexistant at '${configPath}'`);
}

const config = JSON.parse(fs.readFileSync(configPath).toString());

const HTTP_SERVER: express.Express = express();
HTTP_SERVER.use(express.json());
HTTP_SERVER.use(express.urlencoded({ extended: true }));
HTTP_SERVER.listen(config.port, () => log(`Listening on port ${config.port}`));

const workerPath: string = path.resolve(__dirname, BASE_PATH, "worker/index.html");
if (!fs.existsSync(workerPath)) {
	throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}

const fetcher: ChatsoundsFetcher = new ChatsoundsFetcher(config.ghSources);
schedule.scheduleJob(config.fetchInterval, async () => await fetcher.fetch());
fetcher.fetch();

function tryProcessQuery(query: string): string | undefined {
	try {
		query = decodeURIComponent(query);
		log(`Processing query: ${query}`);
		return "HANDLE(`" + JSON.stringify({ input: query, lookup: fetcher.getList() }) + "`);"
	} catch (err) {
		log(`Could not process query ${err.message}`);
		return undefined;
	}
}

function error(res: any, err: string): any {
	log(err);
	res.status(500);
	return res.send({ error: err })
}

const workerPool: WorkerPool = new WorkerPool(config.maxWorkers);
HTTP_SERVER.get("/chatsounds/stream", async (request, result) => {
	const query: string | undefined = request.query.query as string;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	const code: string | undefined = tryProcessQuery(query);
	if (!code) return error(result, "Could not parse query");

	const res: EvalResult = await workerPool.evaluate(code, config.queryTimeout);
	if (res.error) return error(result, res.error.message);
	if (!res.stream) return error(result, "Stream was undefined");

	result.writeHead(206, {
		"accept-ranges": "bytes",
		"Content-Type": "audio/ogg"
	});
	res.stream.pipe(result);
});

HTTP_SERVER.get("/chatsounds/map", async (_, result) => {
	return result.send(fetcher.getList().toJson());
});
