import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class LegacyPitchModifier implements IChatsoundModifier {
	name: string = "";
	value: [number, number] = [1, 2];
	legacyCharacter: string = "%%";
	isScoped: boolean = false;

	private castArgToNum(input: string): number {
		const value: number = parseFloat(input);
		if (isNaN(value)) {
			return 1;
		}

		return value / 100;
	}

	process(strArgs: Array<string>, _: boolean): void {
		this.value = [this.castArgToNum(strArgs[0]), this.castArgToNum(strArgs[1])];
	}


	// figure out a way to smooth pitch from min to max
	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		/*let pitchShift: Tone.PitchShift = new Tone.PitchShift(1);
		if (isLastToProcess) {
			pitchShift = pitchShift.toDestination();
		}

		let internalValue: number = Math.abs(this.value); // low is between 0 and 1, high is above 1
		if (internalValue >= 0 && internalValue < 1) {
			internalValue = (1 - internalValue) * -10;
		}

		pitchShift.pitch = internalValue;
		player.connect(pitchShift);*/
	}
}