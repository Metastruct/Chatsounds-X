export interface IChatsoundModifier {
	name: string;
	legacyCharacter?: string;
	escapeLegacy?: boolean;
	value: any;
	process(strArgs: Array<string>): void;
}

export class ChatsoundContextModifier {
	public content: string;
	public modifiers: Array<IChatsoundModifier>;
	public parentContext?: ChatsoundContextModifier;
	public isParent: boolean;
	public isScoped: boolean;
	public illegalCharPattern: RegExp;

	constructor(content: string = "", modifiers: Array<IChatsoundModifier> = [], isScoped: boolean = false) {
		this.content = content;
		this.modifiers = modifiers;
		this.isParent = false;
		this.isScoped = isScoped;
		this.illegalCharPattern = /[()!?]+/g;
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
		this.modifiers = this.modifiers.concat(modifiers);
	}
}