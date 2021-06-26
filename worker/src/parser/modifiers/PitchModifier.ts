import Stream from "../../webaudio/Stream";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class PitchModifier implements IChatsoundModifier {
	name: string = "pitch";
	value: number = 1;
	legacyCharacter: string = "%";
	isScoped: boolean = false;

	process(strArgs: Array<string>): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value)) {
			this.value = 1;
			return;
		}

		this.value = value;
	}

	processStream(stream: Stream): void {

	}
}