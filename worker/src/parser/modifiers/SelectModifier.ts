import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	escapeLegacy?: boolean | undefined;
	value: number = 0;
	name: string = "";
	legacyCharacter: string = "#";

	process(strArgs: Array<string>): void {
		const value: number = parseInt(strArgs[0]);
		if (isNaN(value) || value < 0) {
			this.value = 0;
		} else {
			this.value = value;
		}
	}
}