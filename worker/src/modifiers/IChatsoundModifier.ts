import * as Tone from "tone";

export type ChatsoundModifierOptions = {
	time?: Tone.Unit.Time,
	offset?: Tone.Unit.Time,
	duration?: Tone.Unit.Time,
	loops?: number,
}

export default interface IChatsoundModifier {
	name: string;
	legacyCharacter?: string;
	escapeLegacy?: boolean;
	value: any;
	isScoped: boolean;
	process(strArgs: Array<string>, legacy: boolean): void;
	processAudio(player: Tone.Player, opts: ChatsoundModifierOptions): void;
}
