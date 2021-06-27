import * as Tone from "tone";
import Chatsound from "../parser/Chatsound";
import { IChatsoundModifier } from "../parser/ChatsoundModifier";

type ChatsoundAudioNode = { buffer: Tone.ToneAudioBuffer, modifiers: Array<IChatsoundModifier> };

const MAX_SOUND_DURATION: number = 300000;
export default class ChatsoundsAudioController {
	private async resolveBuffer(buffer: Tone.ToneAudioBuffer): Promise<Tone.ToneAudioBuffer> {
		return await new Promise<Tone.ToneAudioBuffer>(resolve => {
			if (buffer.loaded) {
				resolve(buffer);
				return;
			}

			buffer.onload = resolve;
		});
	}

	private async listen(player: Tone.Player): Promise<void> {
		return new Promise<void>(resolve => {
			setTimeout(() => {
				player.stop();
				resolve();
			}, MAX_SOUND_DURATION)
			player.onstop = () => resolve();
		});
	}

	public async process(chatsounds: Array<Chatsound>): Promise<void> {
		await Tone.start();

		const audioNodes: Array<ChatsoundAudioNode> = chatsounds.map(cs => ({ buffer: new Tone.Buffer(cs.url), modifiers: cs.modifiers }));
		for (const node of audioNodes) {
			const buffer: Tone.ToneAudioBuffer = await this.resolveBuffer(node.buffer);
			const ply: Tone.Player = new Tone.Player(buffer).toDestination();

			for (const modifier of node.modifiers) {
				modifier.processAudio(ply);
			}

			ply.start();
			await this.listen(ply);
		}
	}
}