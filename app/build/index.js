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
const WorkerPool_1 = __importDefault(require("./WorkerPool"));
const SERVER_PORT = 6009;
const QUERY_TIMEOUT = 60000; // 60 seconds
const MAX_WORKERS = 15;
const HTTP_SERVER = express_1.default();
HTTP_SERVER.use(express_1.default.json());
HTTP_SERVER.use(express_1.default.urlencoded({ extended: true }));
HTTP_SERVER.listen(SERVER_PORT, () => console.log(`Listening on port ${SERVER_PORT}`));
const workerPath = path_1.default.resolve(__dirname, "../../worker/index.html");
if (!fs_1.default.existsSync(workerPath)) {
    throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}
const workerPool = new WorkerPool_1.default(MAX_WORKERS);
HTTP_SERVER.post("/chatsound", (request, result) => __awaiter(void 0, void 0, void 0, function* () {
    const query = request.body.query;
    if (!query || query.length === 0) {
        result.status(400);
        return result.send("The 'query' parameter was not specified");
    }
    try {
        const code = "HANDLE(`" + JSON.stringify({ input: query, lookup: [] }) + "`);";
        const ret = yield workerPool.evaluate(code, QUERY_TIMEOUT);
        return result.send(ret);
    }
    catch (err) {
        result.status(500);
        return result.send(err.message);
    }
}));
