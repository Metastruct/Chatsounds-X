import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class SkipModifier implements IChatsoundModifier {
	name: string = "skip";
	value: number = 0;
	legacyCharacter: string = "++";
	escapeLegacy: boolean = true;
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 0;
		} else if (value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		opts.time = this.value;
	}
}