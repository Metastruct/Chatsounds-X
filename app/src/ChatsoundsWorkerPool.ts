import path from "path";
import sleep from "sleep-promise";
import log from "./log";
import { ChatsoundsLookup } from "./ChatsoundsFetcher";
import puppeteer, { Browser, Page } from "puppeteer";
import { Stream } from "stream";
import StreamServer from "./StreamServer";
import guid from "guid";

const Xvfb = require("xvfb"); // this doesnt like to be imported

export type Worker = { working: boolean, context: Page };
export type StreamResult = { stream?: Stream, id?: string, error?: Error };
export type ParseResult = { result?: any, error?: Error };

export default class ChatsoundsWorkerPool {
	private streamServer: StreamServer;
	private workers: Array<Worker> = [];
	private maxWorkers: number;
	private tmpWorkerCount: number;
	private browser: Browser | undefined;

	constructor(streamServer: StreamServer, cachedWorkers: number, maxWorkers: number) {
		this.streamServer = streamServer;
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
			displayNum: Math.round(50 + Math.random() * 100), // pick a random screen number
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

		this.browser = await puppeteer.launch({
			headless: false,
			defaultViewport: undefined,
			ignoreDefaultArgs: ["--mute-audio"],
			args: [
				"--no-sandbox",
				`--display=${xvfb._display}`,
				"--use-fake-ui-for-media-stream",
				"--use-fake-device-for-media-stream",
				"--allow-file-access",
				"--autoplay-policy=no-user-gesture-required",
				"--disable-features=AutoplayIgnoreWebAudio",
				"--enable-usermedia-screen-capturing",
				"--allow-http-screen-capture",
			],
		});

		for (let i = 0; i < cachedWorkers; i++) {
			const worker: Worker | undefined = await this.newWorker();
			if (!worker) continue;

			this.workers.push(worker);
		}

		log("Chatsounds pool initialized");
	}

	private sanitizeString(str: string): string {
		return decodeURIComponent(str).toLowerCase().replace(/\?+/g, "");
	}

	private processStreamQuery(id: string, query: string, lookup: ChatsoundsLookup): string {
		return JSON.stringify({ id: id, input: this.sanitizeString(query), lookup: lookup });
	}

	private processParseQuery(query: string, lookup: ChatsoundsLookup): string {
		return JSON.stringify({ input: this.sanitizeString(query), lookup: lookup });
	}

	private async newWorker(): Promise<Worker | undefined> {
		if (this.browser === undefined) return undefined;

		const page = await this.browser.newPage();
		await page.goto("file:///" + path.resolve(__dirname, "../../worker/index.html"));

		return { working: false, context: page };
	}

	private async getCachedStream(id: string, json: string, timeout: number): Promise<StreamResult | undefined> {
		for (const worker of this.workers) {
			if (worker.working) continue;

			worker.working = true;
			worker.context.evaluate("HANDLE_STREAM(`" + json + "`);")
				.finally(() => worker.working = false);

			const stream: Stream | undefined = await this.streamServer.tryGetStream(id, timeout);
			if (!stream) return undefined;

			return {
				stream: stream,
				id: id,
			};
		}

		return undefined;
	}

	private async getTemporaryStream(id: string, json: string, timeout: number): Promise<StreamResult | undefined> {
		const worker: Worker | undefined = await this.newWorker();
		if (worker) {
			this.tmpWorkerCount++;

			worker.context.evaluate("HANDLE_STREAM(`" + json + "`);")
				.finally(async () => {
					try {
						if (!worker.context.isClosed()) {
							await worker.context.close();
						}
					} finally {
						this.tmpWorkerCount--;
					}
				});

			return {
				stream: await this.streamServer.tryGetStream(id, timeout),
			};
		}

		return undefined;
	}

	public async tryGetStream(id: string, timeout: number): Promise<Stream | undefined> {
		return await this.streamServer.tryGetStream(id, timeout);
	}

	public async createStream(query: string, lookup: ChatsoundsLookup, timeout: number): Promise<StreamResult> {
		try {
			log(`Processing stream query: ${query}`);

			const start = Date.now();
			const id: string = guid.create().toString();
			const json: string = this.processStreamQuery(id, query, lookup);

			while (true) {
				let res: StreamResult | undefined = await this.getCachedStream(id, json, timeout);
				if (res && res.stream) return res;

				// if none of the cached workers is available give a new temporary one
				if (this.workers.length + this.tmpWorkerCount < this.maxWorkers) {
					res = await this.getTemporaryStream(id, json, timeout);
					if (res && res.stream) return res;
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
			return {
				error: err,
			}
		}
	}

	public async parse(query: string, lookup: ChatsoundsLookup): Promise<ParseResult> {
		try {
			log(`Processing parse query: ${query}`);

			const json: string = this.processParseQuery(query, lookup);
			const worker: Worker | undefined = await this.newWorker();
			if (worker) {
				const result = await worker.context.evaluate("HANDLE_PARSE(`" + json + "`);");
				worker.context.close(); // don't await close, send the result right away
				return {
					result: result,
				}
			} else {
				return {
					error: new Error("App is still initializing"),
				}
			}
		}
		catch (err) {
			return {
				error: err,
			}
		}
	}
}