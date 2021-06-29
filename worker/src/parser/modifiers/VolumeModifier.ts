import * as Tone from "tone";
import { IChatsoundModifier } from "../ChatsoundModifier";

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
		} else if (legacy && value > 500) { // handle max volume in legacy mode "awdawd^999999"
			this.value = 5;
		} else if (!legacy && value > 5) { // handle max volume "awdawd:volume(99999)"
			this.value = 5
		} else {
			this.value = legacy ? value / 100 : value;
		}
	}

	processAudio(player: Tone.Player, isLastToProcess: boolean): void {
		player.volume.value = this.value;

		if (isLastToProcess) {
			player.toDestination();
		}
	}
}