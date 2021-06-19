import path from "path";
import puppeteer, { Browser, Page } from "puppeteer";
import sleep from "sleep-promise";

type Worker= { busy: boolean, context: Page, browser: Browser };

export default class WorkerPool {
	private workers: Array<Worker> = [];

	constructor(maxWorkers: number) {
		(async () => {
			for (let i = 0; i < maxWorkers; i++) {
				const browser: Browser = await puppeteer.launch();
				const page: Page = await browser.newPage();
				await page.goto(path.resolve(__dirname, "../../worker/index.html"));

				this.workers.push({
					busy: false,
					browser: browser,
					context: page,
				});
			}
		})();
	}

	public async evaluate(code: string, timeout: number): Promise<any> {
		const start = Date.now();
		while (true) {
			for (const worker of this.workers) {
				if (!worker.busy) {
					const promise: Promise<any> = worker.context.evaluate(code);
					worker.busy = true;
					const res = await promise;
					worker.busy = false;

					return res;
				}
			}

			await sleep(100);
			if ((Date.now() - start) >= timeout) throw new Error("Timeout");
		}
	}
}