import * as Tone from "tone";
import IChatsoundModifier, { ChatsoundModifierOptions } from "./IChatsoundModifier";

export default class RealmModifier implements IChatsoundModifier {
	name: string = "realm";
	value: string = "";
	isScoped: boolean = false;

	process(strArgs: Array<string>, legacy: boolean): void {
		this.value = strArgs[0];
	}

	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions, isLastToProcess: boolean): void {
	}
}