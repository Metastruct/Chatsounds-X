import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RepeatModifier implements IChatsoundModifier {
	name: string = "rep";
	value: number = 0;
	legacyCharacter: string = "*";
	escapeLegacy: boolean = true;

	process(strArgs: Array<string>): void {
		throw new Error("Method not implemented.");
	}
}