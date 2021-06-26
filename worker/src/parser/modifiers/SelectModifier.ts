import * as Tone from "tone";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	escapeLegacy?: boolean | undefined;
	value: number = 0;
	name: string = "";
	legacyCharacter: string = "#";
	isScoped: boolean = false;

	process(strArgs: Array<string>): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value) || value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}

	processAudio(player: Tone.Player): void {

	}
}