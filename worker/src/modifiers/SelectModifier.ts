import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	escapeLegacy: boolean = false;
	value: number = 0;
	name: string = "";
	legacyCharacter: string = "#";
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value) || value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}

	// no audio processing here
	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {}
}