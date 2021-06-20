"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const WorkerPool_1 = __importDefault(require("./WorkerPool"));
const ChatsoundsFetcher_1 = __importDefault(require("./ChatsoundsFetcher"));
const configBuffer = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "../../config.json"));
const config = JSON.parse(configBuffer.toString());
const HTTP_SERVER = express_1.default();
HTTP_SERVER.use(express_1.default.json());
HTTP_SERVER.use(express_1.default.urlencoded({ extended: true }));
HTTP_SERVER.listen(config.port, () => console.log(`Listening on port ${config.port}`));
const workerPath = path_1.default.resolve(__dirname, "../../worker/index.html");
if (!fs_1.default.existsSync(workerPath)) {
    throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}
const fetcher = new ChatsoundsFetcher_1.default();
node_schedule_1.default.scheduleJob(config.rebuildLookupCron, () => __awaiter(void 0, void 0, void 0, function* () { return yield fetcher.fetch(); }));
function tryProcessQuery(query) {
    try {
        return "HANDLE(`" + JSON.stringify({ input: decodeURIComponent(query), lookup: fetcher.getLookup() }) + "`);";
    }
    catch (_a) {
        return undefined;
    }
}
function error(res, err) {
    res.status(500);
    return res.send({ error: err });
}
const workerPool = new WorkerPool_1.default(config.maxWorkers);
HTTP_SERVER.get("/chatsound", (request, result) => __awaiter(void 0, void 0, void 0, function* () {
    const query = request.query.query;
    if (!query || query.length === 0) {
        result.status(400);
        return result.send("The 'query' parameter was not specified");
    }
    const code = tryProcessQuery(query);
    if (!code)
        return error(result, "Could not parse query");
    const res = yield workerPool.evaluate(code, config.queryTimeout);
    if (res.error)
        return error(result, res.error.message);
    if (!res.stream)
        return error(result, "Stream was undefined");
    result.writeHead(206, {
        "accept-ranges": "bytes",
        "Content-Type": "audio/ogg"
    });
    res.stream.pipe(result);
}));
