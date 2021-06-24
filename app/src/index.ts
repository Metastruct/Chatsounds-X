import express from "express";
import path from "path";
import fs from "fs";
import schedule from "node-schedule";
import WorkerPool, { ParseResult, StreamResult } from "./WorkerPool";
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
//schedule.scheduleJob(config.fetchInterval, async () => await fetcher.fetch());
//fetcher.fetch();

function error(res: any, err: string): any {
	log(err);
	res.status(500);
	return res.send({ error: err })
}

const workerPool: WorkerPool = new WorkerPool(config.cachedWorkers, config.maxWorkers);
HTTP_SERVER.get("/chatsounds/stream", async (request, result) => {
	const query: string | undefined = request.query.query as string;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	const res: StreamResult = await workerPool.getStream(query, fetcher.getLookup(), config.queryTimeout);
	if (res.error) return error(result, res.error.message);
	if (!res.stream) return error(result, "Stream was undefined");

	result.status(206)
	result.setHeader("Content-Type", "audio/ogg");

	res.stream.pipe(result);
});

HTTP_SERVER.get("/chatsounds/parse", async (request, result) => {
	const query: string | undefined = request.query.query as string;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	const res: ParseResult = await workerPool.parse(query, fetcher.getLookup());
	if (res.error) return error(result, res.error.message);
	if (!res.result) return error(result, "Result was undefined");

	result.setHeader("Content-Type", "application/json");
	result.send(JSON.stringify(res.result));
});

HTTP_SERVER.get("/chatsounds/map", async (_, result) => {
	result.setHeader("Content-Type", "application/json");
	return result.send(fetcher.getList().toJson());
});