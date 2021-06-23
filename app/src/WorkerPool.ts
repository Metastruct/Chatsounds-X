import path from "path";
import sleep from "sleep-promise";
import { launch, getStream, Stream } from "puppeteer-stream";
import log from "./log";

const Xvfb = require("xvfb"); // this doesnt like to be imported

type Worker = { busy: boolean, context: any };
export type EvalResult = { stream?: Stream, error?: Error }

export default class WorkerPool {
	private workers: Array<Worker> = [];
	private maxWorkers: number;
	private tmpWorkerCount: number;
	private browser: any | undefined;

	constructor(cachedWorkers: number, maxWorkers: number) {
		this.maxWorkers = maxWorkers;
		this.tmpWorkerCount = 0;

		this.initialize(cachedWorkers).catch((err) => {
			console.error(`/!\\ COULD NOT START WORKER POOL /!\\:\n${err}`);
			process.exit(1);
		});
	}

	private async initialize(cachedWorkers: number): Promise<void> {
		const xvfb = new Xvfb({
			silent: true,
			reuse: true,
			displayNum: Math.round(50 + Math.random() * 100),
			//xvfb_args: ["-screen", "0", "800x600", "-ac"],
		});

		try {
			await new Promise<void>((resolve, reject) => xvfb.start((err: Error) => err ? reject(err) : resolve()));
		} catch(err) {
			if (err.message.includes("ENOENT")) {
				log("/!\\ XVFB MISSING, THIS PROCESS REQUIRES A DISPLAY TO RUN /!\\");
			} else {
				throw err;
			}
		}

		this.browser = await launch({
			headless: false,
			defaultViewport: undefined,
			args: ["--no-sandbox", `--display=${xvfb._display}`],
		});

		for (let i = 0; i < cachedWorkers; i++) {
			const worker: Worker | undefined = await this.newWorker();
			if (!worker) continue;

			this.workers.push(worker);
		}

		log("Worker pool initialized");
	}

	private async newWorker(): Promise<Worker | undefined> {
		if (this.browser === undefined) return undefined;

		const page = await this.browser.newPage();
		await page.goto("file:///" + path.resolve(__dirname, "../../worker/index.html"));

		return { busy: false, context: page };
	}

	private async getCachedStream(code: string): Promise<EvalResult | undefined> {
		for (const worker of this.workers) {
			if (!worker.busy) {
				worker.busy = true;

				const promise: Promise<any> = worker.context.evaluate(code);
				promise.then((res) => {
					console.debug(res);
					worker.busy = false;
				}).catch(() => worker.busy = false);

				const stream: Stream = await getStream(worker.context, { audio: true, video: false, mimeType: "audio/ogg" });
				return {
					stream: stream,
				};
			}
		}

		return undefined;
	}

	private async getTemporaryStream(code: string): Promise<EvalResult | undefined> {
		const worker: Worker | undefined = await this.newWorker();
		if (worker) {
			this.tmpWorkerCount++;

			const promise: Promise<any> = worker.context.evaluate(code);
			const stream: Stream = await getStream(worker.context, { audio: true, video: false, mimeType: "audio/ogg" });
			const close = async () => {
				try {
					if (!stream.destroyed) {
						await stream.destroy();
					}

					if (!worker.context.isClosed()) {
						await worker.context.close();
					}
				} finally {
					this.tmpWorkerCount--;
				}
			};

			promise.then((res) => {
				console.debug(res);
				close();
			}).catch(() => close());

			return {
				stream: stream,
			};
		}

		return undefined;
	}

	public async evaluate(code: string, timeout: number): Promise<EvalResult> {
		try {
			const start = Date.now();
			while (true) {
				let res: EvalResult | undefined = await this.getCachedStream(code);
				if (res?.stream) return res;

				// if none of the cached workers is available give a new temporary one
				if (this.workers.length + this.tmpWorkerCount < this.maxWorkers) {
					res = await this.getTemporaryStream(code);
					if (res?.stream) return res;
				}

				await sleep(100);
				if ((Date.now() - start) >= timeout) {
					return {
						error: new Error("Timeout"),
					}
				}
			}
		}
		catch (err) {
			console.debug(err);
			return {
				error: err,
			}
		}
	}
}