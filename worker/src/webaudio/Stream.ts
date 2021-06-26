const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default class Stream {
	// general
	public buffer: AudioBuffer;
	public audio: AudioContext;
	public url: string;
	public position: number = 0;
	public speed: number = 1; // 1 = normal pitch
	public maxLoop: number = 1; // -1 = inf
	public paused: boolean = true;
	public donePlaying: boolean = false;
	public reverse: boolean = false;

	// smoothing
	public useSmoothing: boolean = true;
	public speedSmooth: number;

	// filtering
	public filterType: number = 0;
	public filterFraction: number = 1;

	// echo
	public useEcho: boolean = false;
	public echoFeedback: number = 0.75;
	public echoBuffer: AudioBuffer | undefined = undefined;
	public echoVolume: number = 0;
	public echoDelay: number = 0;

	// volume
	public volumeBoth: number = 1;
	public volumeLeft: number = 1;
	public volumeRight: number = 1;
	public volumeLeftSmooth: number = 0;
	public volumeRightSmooth: number = 0;

	// lfo
	public lfoVolumeTime: number = 1;
	public lfoVolumeAmount: number = 0;
	public lfoPitchTime: number = 1;
	public lfoPitchAmount: number = 0;

	constructor(buffer: any, audio: AudioContext, url: string) {
		this.buffer = buffer;
		this.audio = audio;
		this.speedSmooth = this.speed;
		this.url = url;
	}

	public play(): void{
		this.position = 0;
		this.paused = false;
	}

	public stop(position?: number): void {
		if (position !== undefined) {
			this.position = position;
		}

		this.paused = true;
	}

	public async listen(): Promise<void> {
		return new Promise(async (resolve) => {
			while (true) {
				if (this.donePlaying) {
					resolve();
					return;
				}

				await sleep(100);
			}
		})
	}

	public useFFT(_: boolean): void {
		// later
	}

	public setUseEcho(enable: boolean): void {
		this.useEcho = enable;
		if (enable) {
			this.setEchoDelay(this.echoDelay);
		} else {
			this.echoBuffer = undefined;
		}
	}

	public setEchoDelay(delay: number): void {
		if (this.useEcho && (!this.echoBuffer || delay != this.echoBuffer.length)) {
			let size: number = 1;
			while ((size <<= 1) < delay);
			this.echoBuffer = this.audio.createBuffer(2, size, this.audio.sampleRate);
		}

		this.echoDelay = delay;
	}
}