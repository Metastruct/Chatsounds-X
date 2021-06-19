import { IChatsoundModifier } from "../ChatsoundModifier";

export default class SelectModifier implements IChatsoundModifier {
	name: string = "";
	legacyPattern: RegExp = /\w\#[0-9]+/g;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}