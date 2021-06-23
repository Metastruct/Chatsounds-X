import { IChatsoundModifier } from "../ChatsoundModifier";

export default class PitchModifier implements IChatsoundModifier {
	name: string = "pitch";
	value: number = 0;
	legacyCharacter: string = "%";

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}