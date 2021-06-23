import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	escapeLegacy?: boolean | undefined;
	value: number = 0;
	name: string = "";
	legacyCharacter: string = "#";

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}