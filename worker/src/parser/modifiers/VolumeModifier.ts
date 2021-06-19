import { IChatsoundModifier } from "../ChatsoundModifier";

export default class VolumeModifier implements IChatsoundModifier {
	name: string = "volume";
	legacyCharacter: string = "^";
	escapeLegacy: boolean = true;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}