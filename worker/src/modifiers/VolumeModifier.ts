import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

const MAX_VOLUME = 12;
export default class VolumeModifier implements IChatsoundModifier {
	name: string = "volume";
	value: number = 100;
	legacyCharacter: string = "^";
	escapeLegacy: boolean = true;
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 1;
		} else if (value < 0) { // negative volume ?
			this.value = 0;
		} else if ((legacy && value > MAX_VOLUME * 100) || (!legacy && value > MAX_VOLUME)) { // handle max volume
			this.value = MAX_VOLUME;
		} else {
			this.value = legacy ? value / 100 : value;
		}
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void {
		const baseVolume: number = -12;
		let internalValue: number = this.value;
		if (this.value > 0 && this.value < 1) {
			internalValue = baseVolume - (1 - this.value) * 20;
		} else if (this.value === 0) {
			internalValue = -100;
		}else {
			internalValue = baseVolume + this.value * 5;
		}

		const vol: Tone.Volume = new Tone.Volume(internalValue);
		player.connect(vol);
	}
}