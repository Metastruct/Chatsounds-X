import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "../modifiers/IChatsoundModifier";
import Chatsound from "../parser/Chatsound";

const MAX_SOUND_DURATION: number = 60000;
const bufferCache: Map<string, Tone.ToneAudioBuffer> = new Map<string, Tone.ToneAudioBuffer>();
export class ChatsoundAudioNode {
	private buffer: Tone.ToneAudioBuffer;
	private chatsound: Chatsound;

	constructor(chatsound: Chatsound) {
		const cachedBuffer: Tone.ToneAudioBuffer | undefined = bufferCache.get(chatsound.url);
		this.buffer = cachedBuffer ? cachedBuffer : new Tone.ToneAudioBuffer(chatsound.url);
		this.chatsound = chatsound;
	}

	// waits for the node's buffer to be fully resolved
	private async resolveBuffer(): Promise<Tone.ToneAudioBuffer> {
		const buffer: Tone.ToneAudioBuffer = await new Promise<Tone.ToneAudioBuffer>(resolve => {
			if (this.buffer.loaded) {
				resolve(this.buffer);
				return;
			}

			this.buffer.onload = (loadedBuffer) => {
				bufferCache.set(this.chatsound.url, loadedBuffer);
				resolve(loadedBuffer);
			}
		});

		return buffer;
	}

	// plays a C5 if the sound is too long as a warning for the listeners
	private tooLongWarning(): void {
		const synth = new Tone.PolySynth(Tone.Synth).toDestination();
		const now = Tone.now()
		synth.triggerAttack("C5", now);
		synth.triggerRelease("C5", now + 0.5);
	}

	// waits for a player to be done playing
	private async listen(player: Tone.Player, duration?: number): Promise<void> {
		return new Promise<void>(resolve => {
			setTimeout(() => {
				if (player.state !== "stopped") {
					player.stop();
					this.tooLongWarning();
					resolve();
				}
			}, MAX_SOUND_DURATION);

			setTimeout(resolve, duration ? duration : player.buffer.duration * 1000)
		});
	}

	public async process(recorder: Tone.Recorder): Promise<void> {
		const buffer: Tone.ToneAudioBuffer = await this.resolveBuffer();
		const ply: Tone.Player = new Tone.Player(buffer.slice(0)); // slice(0) to get a copy and not modify the original buffer

		const opts: ChatsoundModifierOptions = {};
		for (let i = 0; i < this.chatsound.modifiers.length; i++) {
			const modifier: IChatsoundModifier = this.chatsound.modifiers[i];
			modifier.processAudio(ply, opts);
		}

		ply.connect(recorder);

		let { time, offset, duration, loops } = opts;
		if (!loops) loops = 1;
		for (let i = 0; i < loops; i++) {
			ply.start(time, offset, duration);
			await this.listen(ply, duration?.valueOf() as number);
		}
	}
}