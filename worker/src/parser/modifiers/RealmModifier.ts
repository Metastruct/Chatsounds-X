import { IChatsoundModifier } from "../ChatsoundModifier";

export default class RealmModifier implements IChatsoundModifier {
	name: string = "realm";

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}