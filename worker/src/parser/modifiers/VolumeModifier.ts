import { IChatsoundModifier } from "../ChatsoundModifier";

export default class VolumeModifier implements IChatsoundModifier {
	name: string = "volume";
	legacyPattern: RegExp = /\w\^[0-9]+/g;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}