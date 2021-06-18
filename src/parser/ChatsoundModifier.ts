export interface IChatsoundModifier {
	name: string;
	process(soundString: string): void;
}

export class ChatsoundContextModifier {
	public content: string;
	public modifiers: Array<IChatsoundModifier>;
	public parentContext?: ChatsoundContextModifier;

	constructor(content: string, modifiers: Array<IChatsoundModifier>) {
		this.content = content;
		this.modifiers = modifiers;
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
}