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
	}

	public open() {
		this.audio?.destination.disconnect();

		this.audio = new AudioContext();
		this.processor = this.audio.createScriptProcessor(BUFFER_SIZE, 2, 2);
		this.gain = this.audio.createGain();
		this.compressor = this.audio.createDynamicsCompressor();

		this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
			let outputLeft: Float32Array = event.outputBuffer.getChannelData(0);
			let outputRight: Float32Array = event.outputBuffer.getChannelData(1);
			for (let i = 0; i < event.outputBuffer.length; ++i) {
				outputLeft[i] = 0;
				outputRight[i] = 0;
			}

			for (let i = 0; i < this.streams.length; ++i) {
				const stream: Stream = this.streams[i];
				const buffer_length: number = stream.buffer.length;
				const buffer_left: Float32Array = stream.buffer.getChannelData(0);
				const buffer_right: Float32Array =
					stream.buffer.numberOfChannels === 1
						? buffer_left
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

				let echol: any[] | Float32Array;
				let echor: any[] | Float32Array;
				if (stream.useEcho && stream.echoBuffer) {
					echol = stream.echoBuffer.getChannelData(0);
					echor = stream.echoBuffer.getChannelData(1);
				}

				let sml: number = 0;
				let smr: number = 0;
				for (let j = 0; j < event.outputBuffer.length; ++j) {
					if (stream.paused || (stream.maxLoop > 0 && stream.position > buffer_length * stream.maxLoop)) {
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

					let index: number = (stream.position >> 0) % buffer_length;
					if (stream.reverse) {
						index = -index + buffer_length;
					}

					let left: number = 0;
					let right: number = 0;
					if (!stream.donePlaying) {
						// filters
						if (stream.filterType === 0) {
							// None
							left = buffer_left[index] * stream.volumeBoth;
							right = buffer_right[index] * stream.volumeBoth;
						} else {
							sml = sml + (buffer_left[index] - sml) * stream.filterFraction;
							smr = smr + (buffer_right[index] - smr) * stream.filterFraction;
							if (stream.filterType === 1) {
								// Low pass
								left = sml * stream.volumeBoth;
								right = smr * stream.volumeBoth;
							} else if (stream.filterType === 2) {
								// High pass
								left = (buffer_left[index] - sml) * stream.volumeBoth;
								right = (buffer_right[index] - smr) * stream.volumeBoth;
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
						const echo_index: number = (stream.position >> 0) % stream.echoDelay;
						echol[echo_index] = echol[echo_index] * stream.echoFeedback + left;
						echor[echo_index] = echor[echo_index] * stream.echoFeedback + right;
						outputLeft[j] += echol[echo_index];
						outputRight[j] += echor[echo_index];
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
		};

		this.processor.connect(this.compressor);
		this.compressor.connect(this.gain);
		this.gain.connect(this.audio.destination);
	}

	public close() {
		this.audio?.destination.disconnect();
		this.audio = null;
	}

	public async createStream(url: string, id: string, skipCache: boolean) {
		const stream: Stream = await this.factory.createStream(this.audio, url, skipCache);
		this.streamLookup.set(id, stream);
		this.streams.push(stream);
	}

	public destroyStream(id: string) {
		const stream: Stream = this.streamLookup.get(id);
		if (stream) {
			this.streamLookup.delete(id);
			this.factory.destroyStream(stream);

			const index: number = this.streams.indexOf(stream);
			this.streams.splice(index, 1);
		}
	}
}
