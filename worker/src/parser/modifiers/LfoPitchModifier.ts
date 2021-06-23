import { IChatsoundModifier } from "../ChatsoundModifier";

export default class LfoPitchModifier implements IChatsoundModifier {
	name: string = "lfopitch";
	value: number = 0;

	process(strArgs: Array<string>): void {
	}
}