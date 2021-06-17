import Stream from "./Stream";

export default class StreamFactory {
	private bufferCache: Map<string, AudioBuffer> = new Map<string, AudioBuffer>();
	private async downloadBuffer(audio: AudioContext, url: string, skipCache: boolean): Promise<AudioBuffer> {
		if (!skipCache && this.bufferCache.has(url)) {
			return this.bufferCache.get(url);
		}

		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.open("GET", url);
			request.responseType = "arraybuffer";
			request.send();
			request.onload = () => {
				audio.decodeAudioData(
					request.response,
					(buffer: AudioBuffer) => {
						this.bufferCache.set(url, buffer);
						resolve(buffer);
					},
					(err: any) => reject(err),
				);
			};

			request.onerror = () => reject(request.responseText);
		});
	}

	public async createStream(audio: AudioContext, url: string, skipCache: boolean): Promise<Stream> {
		const buffer = await this.downloadBuffer(audio, url, skipCache);
		return new Stream(buffer, audio, url);
	}

	public destroyStream(stream: Stream): void {
		if (stream) {
			this.bufferCache.delete(stream.url);
		}
	}
}