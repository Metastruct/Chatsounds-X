import express from "express";
import path from "path";
import fs from "fs";
import { Stream } from "stream";
import schedule from "node-schedule";
import log from "./log";
import StreamServer from "./StreamServer";
import ChatsoundsWorkerPool, { ParseResult, StreamResult } from "./ChatsoundsWorkerPool";
import ChatsoundsFetcher from "./ChatsoundsFetcher";

const BAD_REQUEST: number = 400;
const INTERNAL_ERROR: number = 500;
const SUCCESS: number = 200;
const SUCCESS_PARTIAL: number = 206;

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

function error(res: any, err: string): any {
	log(err);
	res.status(INTERNAL_ERROR);
	return res.send({ success: false, error: err })
}

const chatsoundsPool: ChatsoundsWorkerPool = new ChatsoundsWorkerPool(new StreamServer(HTTP_SERVER), config.cachedWorkers, config.maxWorkers);
HTTP_SERVER.get("/chatsounds/stream", async (request, result) => {
	result.setHeader("Content-Type", "application/json");

	const query: string | undefined = request.query.query as string;
	const getUrl: boolean = request.query.getUrl == "1";

	if (!query || query.length === 0) {
		result.status(BAD_REQUEST);
		return result.send({ success: false, error: "The 'query' parameter was not specified" });
	}

	const res: StreamResult = await chatsoundsPool.createStream(query, fetcher.getLookup(), config.queryTimeout);
	if (res.error) return error(result, res.error.message);
	if (!res.stream) return error(result, "\'stream\' was undefined");

	if (getUrl) {
		result.status(SUCCESS);
		return result.send({ success: true, url: "/chatsounds/stream/" + res.id });
	}

	result.status(SUCCESS_PARTIAL)
	result.setHeader("Content-Type", "audio/ogg");

	res.stream.pipe(result);
});

HTTP_SERVER.get("/chatsounds/stream/:id", async (request, result) => {
	const streamId: string = request.params["id"];
	const stream: Stream | undefined = await chatsoundsPool.tryGetStream(streamId, config.queryTimeout);
	if (!stream) {
		result.status(BAD_REQUEST);
		return result.send({ success: false, error: `Stream with id \'${streamId}\' does not exist` });
	}

	log("Serving stream " + streamId);
	result.status(SUCCESS_PARTIAL)
	result.setHeader("Content-Type", "audio/ogg");

	stream.pipe(result);
});

HTTP_SERVER.get("/chatsounds/parse", async (request, result) => {
	result.setHeader("Content-Type", "application/json");

	const query: string | undefined = request.query.query as string;
	if (!query || query.length === 0) {
		result.status(BAD_REQUEST);
		return result.send({ success: false, error: "The 'query' parameter was not specified" });
	}

	const res: ParseResult = await chatsoundsPool.parse(query, fetcher.getLookup());
	if (res.error) return error(result, res.error.message);
	if (!res.result) return error(result, "\'result\' was undefined");

	result.send(res.result);
});

HTTP_SERVER.get("/chatsounds/map", async (_, result) => {
	result.setHeader("Content-Type", "application/json");
	return result.send(fetcher.getList().toJson());
});