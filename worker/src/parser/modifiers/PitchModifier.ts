import { IChatsoundModifier } from "../ChatsoundModifier";

export default class PitchModifier implements IChatsoundModifier {
	name: string = "pitch";
	legacyPattern: RegExp = /\w\%[0-9]+/g;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}