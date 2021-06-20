import express from "express";
import path from "path";
import fs from "fs";
import schedule from "node-schedule";
import WorkerPool, { EvalResult } from "./WorkerPool";

const SERVER_PORT: number = 6009;
const QUERY_TIMEOUT: number = 60000; // 60 seconds
const MAX_WORKERS: number = 30;
const HTTP_SERVER: express.Express = express();

HTTP_SERVER.use(express.json());
HTTP_SERVER.use(express.urlencoded({ extended: true }));
HTTP_SERVER.listen(SERVER_PORT, () =>
	console.log(`Listening on port ${SERVER_PORT}`)
);

const workerPath: string = path.resolve(__dirname, "../../worker/index.html");
if (!fs.existsSync(workerPath)) {
	throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}

schedule.scheduleJob("*/5 * * * *", () => {});

function tryProcessQuery(query: { input: string, lookup: Array<string> }): string | undefined {
	try {
		return "HANDLE(`" + JSON.stringify({ input: query, lookup: [] }) + "`);"
	} catch {
		return undefined;
	}
}

function error(res: any, err: string): any {
	res.status(500);
	return res.send({ error: err })
}

const workerPool: WorkerPool = new WorkerPool(MAX_WORKERS);
HTTP_SERVER.post("/chatsound", async (request, result) => {
	const query: string | undefined = request.body.query;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	const code: string | undefined = tryProcessQuery({ input: query, lookup: [] });
	if (!code) return error(result, "Could not parse query");

	const res: EvalResult = await workerPool.evaluate(code, QUERY_TIMEOUT);
	if (res.error) return error(result, res.error.message);
	if (!res.stream) return error(result, "Stream was undefined");

	result.writeHead(206, {
		"accept-ranges": "bytes",
		"Content-Type": "audio/mpeg"
	});
	res.stream.pipe(result);
});
