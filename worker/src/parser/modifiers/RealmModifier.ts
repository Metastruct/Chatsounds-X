import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RealmModifier implements IChatsoundModifier {
	name: string = "realm";
	value: string = "";

	process(strArgs: Array<string>): void {
		throw new Error("Method not implemented.");
	}
}