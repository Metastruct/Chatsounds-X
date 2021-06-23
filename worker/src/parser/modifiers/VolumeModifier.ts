import { IChatsoundModifier } from "../ChatsoundModifier";

export default class VolumeModifier implements IChatsoundModifier {
	name: string = "volume";
	value: number = 0;
	legacyCharacter: string = "^";
	escapeLegacy: boolean = true;

	process(soundString: string): void {
		throw new Error("Method not implemented.");
	}
}