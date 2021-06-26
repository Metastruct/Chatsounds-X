import Stream from "../../webaudio/Stream";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class VolumeModifier implements IChatsoundModifier {
	name: string = "volume";
	value: number = 100;
	legacyCharacter: string = "^";
	escapeLegacy: boolean = true;
	isScoped: boolean = false;

	process(strArgs: Array<string>): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 100;
		} else if (value < 0) {
			this.value = 1;
		} else if (value > 300) {
			this.value = 300;
		} else {
			this.value = value;
		}
	}

	processStream(stream: Stream): void {

	}
}