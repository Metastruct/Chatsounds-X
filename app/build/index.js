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
const Piscina = require("piscina"); // this module doesnt like to be imported with the `import` syntax
const SERVER_PORT = 6009;
const WORKER_TIMEOUT = 60000; // 60 seconds
const HTTP_SERVER = express_1.default();
HTTP_SERVER.use(express_1.default.json());
HTTP_SERVER.use(express_1.default.urlencoded({ extended: true }));
HTTP_SERVER.listen(SERVER_PORT, () => console.log(`Listening on port ${SERVER_PORT}`));
const workerPath = path_1.default.resolve(__dirname, "../../worker/build/index.js");
if (!fs_1.default.existsSync(workerPath)) {
    throw new Error(`Could not initialize worker pool: The worker file is inexistant at '${workerPath}'`);
}
const workerPool = new Piscina({
    filename: workerPath,
});
workerPool.on("error", console.log);
HTTP_SERVER.post("/chatsound", (request, result) => __awaiter(void 0, void 0, void 0, function* () {
    const query = request.body.query;
    if (!query || query.length === 0) {
        result.status(400);
        return result.send("The 'query' parameter was not specified");
    }
    const emitter = new Piscina.EventEmitter();
    try {
        let processed = false;
        const promise = workerPool.run({
            query: query,
            lookup: new Map(),
        }, { signal: emitter });
        setTimeout(() => {
            if (!processed) {
                emitter.emit("abort");
                result.status(408);
            }
        }, WORKER_TIMEOUT);
        const ret = yield promise;
        processed = true;
        return result.send(ret);
    }
    catch (err) {
        if (result.statusCode === 408) {
            return result.send({ error: "Timeout" });
        }
        result.status(500);
        return result.send({ error: err.message });
    }
}));
