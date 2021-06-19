import express from "express";
import path from "path";
import fs from "fs";
import WorkerPool from "./WorkerPool";

const SERVER_PORT: number = 6009;
const QUERY_TIMEOUT: number = 60000; // 60 seconds
const MAX_WORKERS: number = 15;
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

const workerPool: WorkerPool = new WorkerPool(MAX_WORKERS);

HTTP_SERVER.post("/chatsound", async (request, result) => {
	const query: string | undefined = request.body.query;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	try {
		const code: string = "HANDLE(`" + JSON.stringify({ input: query, lookup: [] }) + "`);";
		const ret: Array<string> = await workerPool.evaluate(code, QUERY_TIMEOUT);
		return result.send(ret);
	} catch(err) {
		result.status(500);
		return result.send(err.message);
	}
});
