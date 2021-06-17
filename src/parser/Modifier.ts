export interface IChatsoundModifier {
	name: string;
	process(soundString: string): void;
}

export class ChatsoundContextModifier {
	public input: string;
	public modifiers: Array<IChatsoundModifier>;
	public parentContext?: ChatsoundContextModifier;

	constructor(input: string, modifiers: Array<IChatsoundModifier>) {
		this.input = input;
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