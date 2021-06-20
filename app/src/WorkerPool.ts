import path from "path";
import sleep from "sleep-promise";
import { launch, getStream, Stream } from "puppeteer-stream";

const Xvfb = require("xvfb"); // this doesnt like to be imported

type Worker = { busy: boolean, context: any, browser: any };
export type EvalResult = { stream?: Stream, error?: Error }
export default class WorkerPool {
	private workers: Array<Worker> = [];

	constructor(maxWorkers: number) {
		(async () => {
			const xvfb = new Xvfb({
				silent: true,
				xvfb_args: ["-screen", "0", "800x600", "-ac"],
			});
			xvfb.start((err: Error) => { if (err) console.log("Virtual display not up: " + err.message) });
			const browser = await launch({
				headless: false,
				defaultViewport: undefined,
				args: ["--no-sandbox", "--start-fullscreen",`--display=${xvfb._display}`],
			});
			for (let i = 0; i < maxWorkers; i++) {
				const page = await browser.newPage();
				await page.goto(path.resolve(__dirname, "../../worker/index.html"));

				this.workers.push({
					busy: false,
					browser: browser,
					context: page,
				});
			}
		})();
	}

	public async evaluate(code: string, timeout: number): Promise<EvalResult> {
		try {
			const start = Date.now();
			while (true) {
				for (const worker of this.workers) {
					if (!worker.busy) {
						worker.busy = true;
						const promise: Promise<any> = worker.context.evaluate(code);
						promise.then(() => worker.busy = false).catch(() => worker.busy = false);

						const stream: Stream = await getStream(worker.context, { audio: true, video: false })//, mimeType: "audio/ogg" });
						return {
							stream: stream,
						};
					}
				}

				await sleep(100);
				if ((Date.now() - start) >= timeout) throw new Error("Timeout");
			}
		}
		catch (err) {
			return {
				error: err,
			}
		}
	}
}