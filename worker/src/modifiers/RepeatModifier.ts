import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class RepeatModifier implements IChatsoundModifier {
	name: string = "rep";
	value: number = 1;
	legacyCharacter: string = "*";
	escapeLegacy: boolean = true;
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value) || value < 1) {
			this.value = 1;
		} else {
			this.value = value;
		}
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		opts.loops = this.value;
	}
}