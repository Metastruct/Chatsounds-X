import * as Tone from "tone";
import Chatsound from "../parser/Chatsound";
import { ChatsoundAudioNode } from "./ChatsoundAudioNode";

export default class ChatsoundsAudioController {
	public async process(stream: MediaStream, chatsounds: Array<Chatsound>): Promise<void> {
		await Tone.start();

		const audioNodes: Array<ChatsoundAudioNode> = chatsounds.map(cs => new ChatsoundAudioNode(cs));
		for (const node of audioNodes) {
			await node.process(stream);
		}
	}
}