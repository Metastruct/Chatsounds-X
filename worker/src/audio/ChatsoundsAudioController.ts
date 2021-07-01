import * as Tone from "tone";
import Chatsound from "../parser/Chatsound";
import { ChatsoundAudioNode } from "./ChatsoundAudioNode";

Tone.start();

const MAX_STREAM_DURATION: number = 300000;
export default class ChatsoundsAudioController {
	public process(chatsounds: Array<Chatsound>): MediaStream {
		const audioNodes: Array<ChatsoundAudioNode> = chatsounds.map(cs => new ChatsoundAudioNode(cs));
		const recorder: Tone.Recorder = new Tone.Recorder();
		recorder.start();

		this.processNodes(recorder, audioNodes);

		// @ts-ignore lets take advantage of the fact this runs js under the hood
		return recorder._stream.stream;
	}

	private async processNodes(recorder: Tone.Recorder, audioNodes: Array<ChatsoundAudioNode>): Promise<void> {
		setTimeout(() => recorder.stop(), MAX_STREAM_DURATION);

		for (const node of audioNodes) {
			await node.process(recorder);
		}

		recorder.stop();
	}
}