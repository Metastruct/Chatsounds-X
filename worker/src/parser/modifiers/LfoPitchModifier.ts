import * as Tone from "tone";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class LfoPitchModifier implements IChatsoundModifier {
	name: string = "lfopitch";
	value: [number, number] = [100, 1000];
	isScoped: boolean = false;

	private castArgToNum(input: string): number {
		const n: number = parseFloat(input);
		if (isNaN(n)) return 1;
		if (n < 1) return 1;

		return n;
	}

	process(strArgs: Array<string>, _: boolean): void {
		this.value = [this.castArgToNum(strArgs[0]), this.castArgToNum(strArgs[1])];
	}

	processAudio(player: Tone.Player, isLastToProcess: boolean): void {
		const lfo: Tone.LFO = new Tone.LFO("1n", this.value[0], this.value[1]);
		if (isLastToProcess) {
			lfo.toDestination();
		}

		player.connect(lfo);
	}
}