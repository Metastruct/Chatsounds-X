import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SkipModifier implements IChatsoundModifier {
	name: string = "skip";
	value: number = 0;
	legacyCharacter: string = "++";
	escapeLegacy: boolean = true;

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
}