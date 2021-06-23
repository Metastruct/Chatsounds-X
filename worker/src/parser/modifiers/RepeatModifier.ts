import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RepeatModifier implements IChatsoundModifier {
	name: string = "rep";
	value: number = 1;
	legacyCharacter: string = "*";
	escapeLegacy: boolean = true;

	process(strArgs: Array<string>): void {
		const value: number = parseFloat(strArgs[0]);
		if (isNaN(value) || value < 1) {
			this.value = 1;
		} else {
			this.value = value;
		}
	}
}