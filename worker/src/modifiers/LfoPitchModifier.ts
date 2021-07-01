import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class LfoPitchModifier implements IChatsoundModifier {
	name: string = "lfopitch";
	value: [number, number] = [100, 200];
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

	// This KILLS my windows audio driver for some reason, figure out why?
	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		/*const lfo: Tone.LFO = new Tone.LFO("1n", this.value[0], this.value[1]);
		if (isLastToProcess) {
			lfo.toDestination();
		}

		player.connect(lfo);*/
	}
}