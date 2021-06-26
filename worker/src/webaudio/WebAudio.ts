import Stream from "./Stream";
import StreamFactory from "./StreamFactory";

const BUFFER_SIZE: number = 1024;
export default class WebAudio {
	private audio: AudioContext;
	private gain: GainNode;
	private processor: ScriptProcessorNode;
	private compressor: DynamicsCompressorNode;
	private streamLookup: Map<string, Stream>;
	private streams: Array<Stream>;
	private factory: StreamFactory;

	constructor() {
		this.streams = [];
		this.factory = new StreamFactory();
		this.streamLookup = new Map<string, Stream>();

		this.audio = new AudioContext();
		this.processor = this.audio.createScriptProcessor(BUFFER_SIZE, 2, 2);
		this.gain = this.audio.createGain();
		this.compressor = this.audio.createDynamicsCompressor();
		this.processor.onaudioprocess = (ev) => this.onAudioProcess(ev);

		this.processor.connect(this.compressor);
		this.compressor.connect(this.gain);
		this.gain.connect(this.audio.destination);
	}

	private onAudioProcess(event: AudioProcessingEvent): void {
		let outputLeft: Float32Array = event.outputBuffer.getChannelData(0);
		let outputRight: Float32Array = event.outputBuffer.getChannelData(1);
		for (let i = 0; i < event.outputBuffer.length; ++i) {
			outputLeft[i] = 0;
			outputRight[i] = 0;
		}

		for (let i = 0; i < this.streams.length; ++i) {
			const stream: Stream = this.streams[i];
			const bufferLen: number = stream.buffer.length;
			const bufferLeft: Float32Array = stream.buffer.getChannelData(0);
			const bufferRight: Float32Array =
				stream.buffer.numberOfChannels === 1
					? bufferLeft
					: stream.buffer.getChannelData(1);

			if (stream.useSmoothing) {
				stream.speedSmooth =
					stream.speedSmooth + (stream.speed - stream.speedSmooth) * 1;

				stream.volumeLeftSmooth =
					stream.volumeLeftSmooth +
					(stream.volumeLeft - stream.volumeLeftSmooth) * 1;

				stream.volumeRightSmooth =
					stream.volumeRightSmooth +
					(stream.volumeRight - stream.volumeRightSmooth) * 1;
			} else {
				stream.speedSmooth = stream.speed;
				stream.volumeLeftSmooth = stream.volumeLeftSmooth;
				stream.volumeRightSmooth = stream.volumeRightSmooth;
			}

			if (!stream.useEcho && (stream.paused || (stream.volumeLeft < 0.001 && stream.volumeRight < 0.001))) {
				continue;
			}

			let echol: any[] | Float32Array = [];
			let echor: any[] | Float32Array = [];
			if (stream.useEcho && stream.echoBuffer) {
				echol = stream.echoBuffer.getChannelData(0);
				echor = stream.echoBuffer.getChannelData(1);
			}

			let sml: number = 0;
			let smr: number = 0;
			for (let j = 0; j < event.outputBuffer.length; ++j) {
				if (stream.paused || (stream.maxLoop > 0 && stream.position > bufferLen * stream.maxLoop)) {
					stream.donePlaying = true;
					if (!stream.paused) {
						stream.paused = true;
					}

					if (!stream.useEcho) {
						break;
					}
				} else {
					stream.donePlaying = false;
				}

				let index: number = (stream.position >> 0) % bufferLen;
				if (stream.reverse) {
					index = -index + bufferLen;
				}

				let left: number = 0;
				let right: number = 0;
				if (!stream.donePlaying) {
					// filters
					if (stream.filterType === 0) {
						// None
						left = bufferLeft[index] * stream.volumeBoth;
						right = bufferRight[index] * stream.volumeBoth;
					} else {
						sml = sml + (bufferLeft[index] - sml) * stream.filterFraction;
						smr = smr + (bufferRight[index] - smr) * stream.filterFraction;
						if (stream.filterType === 1) {
							// Low pass
							left = sml * stream.volumeBoth;
							right = smr * stream.volumeBoth;
						} else if (stream.filterType === 2) {
							// High pass
							left = (bufferLeft[index] - sml) * stream.volumeBoth;
							right = (bufferRight[index] - smr) * stream.volumeBoth;
						}
					}

					left = Math.min(Math.max(left, -1), 1) * stream.volumeLeftSmooth;
					right = Math.min(Math.max(right, -1), 1) * stream.volumeRightSmooth;
				}

				if (stream.lfoVolumeTime) {
					const res: number =
						Math.sin(
							(stream.position / this.audio.sampleRate) *
							10 *
							stream.lfoVolumeTime
						) * stream.lfoVolumeAmount;
					left *= res;
					right *= res;
				}

				if (stream.useEcho) {
					const echoIndex: number = (stream.position >> 0) % stream.echoDelay;
					echol[echoIndex] *= stream.echoFeedback + left;
					echor[echoIndex] *= stream.echoFeedback + right;
					outputLeft[j] += echol[echoIndex];
					outputRight[j] += echor[echoIndex];
				} else {
					outputLeft[j] += left;
					outputRight[j] += right;
				}

				let speed: number = stream.speedSmooth;
				if (stream.lfoPitchTime) {
					speed -=
						Math.sin(
							(stream.position / this.audio.sampleRate) *
							10 *
							stream.lfoPitchTime
						) * stream.lfoPitchAmount;
					speed += Math.pow(stream.lfoPitchAmount * 0.5, 2);
				}

				stream.position += speed;

				const max: number = 1;
				outputLeft[j] = Math.min(Math.max(outputLeft[j], -max), max);
				outputRight[j] = Math.min(Math.max(outputRight[j], -max), max);

				if (!isFinite(outputLeft[j])) {
					outputLeft[j] = 0;
				}

				if (!isFinite(outputRight[j])) {
					outputRight[j] = 0;
				}
			}
		}
	}

	public close(): void {
		this.audio.destination.disconnect();
	}

	public async createStream(id: string, url: string, skipCache?: boolean): Promise<Stream> {
		if (skipCache === undefined)
			skipCache = false;

		const stream: Stream = await this.factory.createStream(this.audio, url, skipCache);
		this.streamLookup.set(id, stream);
		this.streams.push(stream);

		return stream;
	}

	public destroyStream(id: string): void {
		const stream: Stream | undefined = this.streamLookup.get(id);
		if (!stream) return;

		this.streamLookup.delete(id);
		this.factory.destroyStream(stream);

		const index: number = this.streams.indexOf(stream);
		this.streams.splice(index, 1);
	}
}
