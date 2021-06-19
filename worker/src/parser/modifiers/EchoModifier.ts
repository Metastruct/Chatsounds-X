import { IChatsoundModifier } from "../ChatsoundModifier";

export default class EchoModifier implements IChatsoundModifier {
	name: string = "echo";

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}