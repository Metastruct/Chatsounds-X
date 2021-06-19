import express from "express";
import path from "path";
import fs from "fs";

const Piscina = require("piscina"); // this module doesnt like to be imported with the `import` syntax
const SERVER_PORT: number = 6009;
const WORKER_TIMEOUT: number = 60000; // 60 seconds
const HTTP_SERVER: express.Express = express();

HTTP_SERVER.use(express.json());
HTTP_SERVER.use(express.urlencoded({ extended: true }));
HTTP_SERVER.listen(SERVER_PORT, () =>
	console.log(`Listening on port ${SERVER_PORT}`)
);

const workerPath: string = path.resolve(__dirname, "../../worker/build/index.js");
if (!fs.existsSync(workerPath)) {
	throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}

const workerPool = new Piscina({
	filename: workerPath,
});

workerPool.on("error", console.log);

HTTP_SERVER.post("/chatsound", async (request, result) => {
	const query: string | undefined = request.body.query;
	if (!query || query.length === 0) {
		result.status(400);
		return result.send("The 'query' parameter was not specified");
	}

	const emitter = new Piscina.EventEmitter();
	try {
		let processed: boolean = false;
		const promise: Promise<Array<string>> = workerPool.run({
			query: query,
			lookup: new Map<string, string>(),
		}, { signal: emitter });

		setTimeout(() => {
			if (!processed) {
				emitter.emit("abort");
				result.status(408);
			}
		}, WORKER_TIMEOUT);

		const ret: Array<string> = await promise;
		processed = true;
		return result.send(ret);
	} catch (err) {
		if (result.statusCode === 408) {
			return result.send({ error: "Timeout" });
		}

		result.status(500);
		return result.send({ error: err.message });
	}
});
