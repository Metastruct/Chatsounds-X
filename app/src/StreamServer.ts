import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Stream } from "stream";
import sleep from "sleep-promise";

export default class StreamServer extends Server {
	private streams: Map<string, Stream>;

	constructor(httpServer: express.Express) {
		super();

		this.streams = new Map<string, Stream>();
		this.listen(createServer(httpServer), {
			pingInterval: 10000,
			pingTimeout: 5000,
			cookie: false
		});

		this.on("debug", console.log);

		this.of("/internal/stream").on("connection", socket => {
			socket.on("audio", (stream: Stream, data: { id: string; }) => {
				this.streams.set(data.id, stream);
				stream.once("close", () => this.streams.delete(data.id));
			});
		});
	}

	public async tryGetStream(id: string, timeout: number): Promise<Stream | undefined> {
		const start: number = Date.now();
		let stream: Stream | undefined = this.streams.get(id);
		while (!stream) {
			stream = this.streams.get(id);
			await sleep(100);

			if ((Date.now() - start) >= timeout) {
				return undefined;
			}
		}

		return stream;
	}
}