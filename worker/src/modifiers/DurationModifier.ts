import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class DurationModifier implements IChatsoundModifier {
	name: string = "duration";
	value: number = 0;
	legacyCharacter: string = "=";
	escapeLegacy: boolean = false;
	isScoped: boolean = false;

	process(strArgs: Array<string>, _: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 0;
		} else if (value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions, isLastToProcess: boolean): void {
		opts.duration = this.value * 1000; // convert to ms

		if (isLastToProcess) {
			player.toDestination();
		}
	}
}