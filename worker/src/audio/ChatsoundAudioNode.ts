import * as Tone from "tone";
import Chatsound from "../parser/Chatsound";
import { IChatsoundModifier } from "../parser/ChatsoundModifier";

const MAX_SOUND_DURATION: number = 300000;
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
	private async listen(player: Tone.Player): Promise<void> {
		return new Promise<void>(resolve => {
			setTimeout(() => {
				if (player.state !== "stopped") {
					player.stop();
					this.tooLongWarning();
					resolve();
				}
			}, MAX_SOUND_DURATION);

			setTimeout(resolve, player.buffer.duration * 1000)
		});
	}

	public async process(): Promise<void> {
		const buffer: Tone.ToneAudioBuffer = await this.resolveBuffer();
		const ply: Tone.Player = new Tone.Player(buffer.slice(0)); // slice(0) to get a copy and not modify the original buffer

		for (let i = 0; i < this.chatsound.modifiers.length; i++) {
			const modifier: IChatsoundModifier = this.chatsound.modifiers[i];
			modifier.processAudio(ply, i === this.chatsound.modifiers.length - 1);
		}

		if (this.chatsound.modifiers.length === 0) {
			ply.toDestination();
		}

		ply.start();
		await this.listen(ply);
	}
}