import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	name: string = "";
	legacyCharacter: string = "#";

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}