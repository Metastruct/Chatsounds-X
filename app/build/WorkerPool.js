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
const puppeteer_1 = __importDefault(require("puppeteer"));
const sleep_promise_1 = __importDefault(require("sleep-promise"));
class WorkerPool {
    constructor(maxWorkers) {
        this.workers = [];
        (() => __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < maxWorkers; i++) {
                const browser = yield puppeteer_1.default.launch();
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
            const start = Date.now();
            while (true) {
                for (const worker of this.workers) {
                    if (!worker.busy) {
                        const promise = worker.context.evaluate(code);
                        worker.busy = true;
                        const res = yield promise;
                        worker.busy = false;
                        return res;
                    }
                }
                yield sleep_promise_1.default(100);
                if ((Date.now() - start) >= timeout)
                    throw new Error("Timeout");
            }
        });
    }
}
exports.default = WorkerPool;
