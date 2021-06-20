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
const path_1 = __importDefault(require("path"));
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const puppeteer_stream_1 = require("puppeteer-stream");
class WorkerPool {
    constructor(maxWorkers) {
        this.workers = [];
        (() => __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer_stream_1.launch({});
            for (let i = 0; i < maxWorkers; i++) {
                const page = yield browser.newPage();
                yield page.goto(path_1.default.resolve(__dirname, "../../worker/index.html"));
                this.workers.push({
                    busy: false,
                    browser: browser,
                    context: page,
                });
            }
        }))();
    }
    evaluate(code, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = Date.now();
                while (true) {
                    for (const worker of this.workers) {
                        if (!worker.busy) {
                            worker.busy = true;
                            const promise = worker.context.evaluate(code);
                            promise.then(() => worker.busy = false).catch(() => worker.busy = false);
                            const stream = yield puppeteer_stream_1.getStream(worker.context, { audio: true, video: false });
                            return {
                                stream: stream,
                            };
                        }
                    }
                    yield sleep_promise_1.default(100);
                    if ((Date.now() - start) >= timeout)
                        throw new Error("Timeout");
                }
            }
            catch (err) {
                return {
                    error: err,
                };
            }
        });
    }
}
exports.default = WorkerPool;
