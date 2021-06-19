import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RepeatModifier implements IChatsoundModifier {
	name: string = "rep";
	legacyCharacter: string = "*";
	escapeLegacy: boolean = true;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}