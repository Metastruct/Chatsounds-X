import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RepeatModifier implements IChatsoundModifier {
	name: string = "rep";
	legacyPattern: RegExp = /\w\*[0-9]+/g;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}