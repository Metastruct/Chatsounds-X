import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class EchoModifier implements IChatsoundModifier {
	name: string = "echo";
	value: [number, number] = [0, 0];
	isScoped: boolean = false;

	private castArgToNum(input: string): number {
		const n: number = parseFloat(input);
		if (isNaN(n)) return 0;
		if (n < 0) return 0;

		return n;
	}

	process(strArgs: Array<string>, legacy: boolean): void {
		this.value = [this.castArgToNum(strArgs[0]), this.castArgToNum(strArgs[1])];
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions, isLastToProcess: boolean): void {
	}
}