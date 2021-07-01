import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class PitchModifier implements IChatsoundModifier {
	name: string = "pitch";
	value: number = 1;
	legacyCharacter: string = "%";
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 1;
			return;
		}

		this.value = legacy ? value / 100 : value;
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		let pitchShift: Tone.PitchShift = new Tone.PitchShift(1);
		if (this.value < 0) { // reverse track if pitch is negative
			player.reverse = true;
		}

		let internalValue: number = Math.abs(this.value); // low is between 0 and 1, high is above 1
		if (internalValue >= 0 && internalValue < 1) {
			internalValue = (1 - internalValue) * -10;
		}

		pitchShift.pitch = internalValue;
		player.connect(pitchShift);
	}
}