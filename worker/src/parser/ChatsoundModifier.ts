import * as Tone from "tone";

export interface IChatsoundModifier {
	name: string;
	legacyCharacter?: string;
	escapeLegacy?: boolean;
	value: any;
	isScoped: boolean;
	process(strArgs: Array<string>): void;
	processAudio(player: Tone.Player): void;
}

export class ChatsoundContextModifier {
	private isScoped: boolean;

	public content: string;
	public modifiers: Array<IChatsoundModifier>;
	public parentContext?: ChatsoundContextModifier;
	public illegalCharPattern: RegExp;

	constructor(content: string = "", modifiers: Array<IChatsoundModifier> = [], isScoped: boolean = false) {
		this.content = content;
		this.modifiers = modifiers;
		this.isScoped = isScoped;
		this.illegalCharPattern = /[()!?]+/g;

		for (const modifier of this.modifiers) {
			modifier.isScoped = this.isScoped;
		}
	}

	public getAllModifiers(): Array<IChatsoundModifier> {
		let ret: Array<IChatsoundModifier> = [];
		let ctx: ChatsoundContextModifier | undefined = this;
		do {
			ret = ret.concat(ctx.modifiers);
			ctx = ctx.parentContext;
		} while (ctx)

		return ret;
	}

	public append(str: string): void {
		this.content += str.replace(this.illegalCharPattern, "");
	}

	public addModifiers(modifiers: Array<IChatsoundModifier>): void {
		for (const modifier of modifiers) {
			modifier.isScoped = this.isScoped;
			this.modifiers.push(modifier);
		}
	}

	public setScoped(scoped: boolean): void {
		this.isScoped = scoped;
		for (const modifier of this.modifiers) {
			modifier.isScoped = this.isScoped;
		}
	}
}