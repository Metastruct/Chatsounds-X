import { IChatsoundModifier } from "../ChatsoundModifier";

export default class EchoModifier implements IChatsoundModifier {
	name: string = "echo";
	value: number = 0;

	process(strArgs: Array<string>): void {
	}
}