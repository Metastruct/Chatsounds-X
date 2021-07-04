import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class LegacyVolumeModifier implements IChatsoundModifier {
	name: string = "";
	value: [number, number] = [1, 2];
	legacyCharacter: string = "^^";
	isScoped: boolean = false;
	escapeLegacy: boolean = true;

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


	// figure out a way to smooth volume from min to max
	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {}
}