import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RealmModifier implements IChatsoundModifier {
	name: string = "realm";
	value: string = "";
	isScoped: boolean = false;

	process(strArgs: Array<string>): void {
		this.value = strArgs[0];
	}
}