import Stream from "../../webaudio/Stream";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class CutOffModifier implements IChatsoundModifier {
	name: string = "cutoff";
	value: number = 0;
	legacyCharacter: string = "--";
	isScoped: boolean = false;

	process(strArgs: Array<string>): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 0;
		} else if (value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}

	processStream(stream: Stream): void {

	}
}