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
	public echoBuffer: AudioBuffer;
	public echoVolume: number = 0;
	public echoDelay: number;

	// volume
	public volumeBoth: number = 1;
	public volumeLeft: number = 1;
	public volumeRight: number = 1;
	public volumeLeftSmooth: number = 0;
	public volumeRightSmooth: number = 0;

	// lfo
	public lfoVolumeTime: number;
	public lfoVolumeAmount: number;
	public lfoPitchTime: number;
	public lfoPitchAmount: number;

	constructor(buffer: any, audio: AudioContext, url: string) {
		this.buffer = buffer;
		this.audio = audio;
		this.speedSmooth = this.speed;
		this.url = url;
	}

	public play(stop: boolean, position: number): void {
		if (position !== undefined) {
			this.position = position;
		}

		this.paused = !stop;
	}

	public usefft(_: boolean): void {
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
		if (
			this.useEcho &&
			(!this.echoBuffer || delay != this.echoBuffer.length)
		) {
			var size = 1;
			while ((size <<= 1) < delay);
			this.echoBuffer = this.audio.createBuffer(2, size, this.audio.sampleRate);
		}
		this.echoDelay = delay;
	}
}