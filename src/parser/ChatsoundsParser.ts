import Chatsound from "./Chatsound";
import { ChatsoundContextModifier } from "./ChatsoundModifier";

const MODIFIER_CHARS = ["^","%","#"];
export default class ChatsoundsParser {
	private lookup: Map<string, string>;

	constructor(lookup: Map<string, string>) {
		this.lookup = lookup;
		// TODO
		// IMPLEMENT LOOKUP TABLE FROM GITHUB SOUND REPOS
	}

	public parse(input: string): Array<Chatsound> {
		let ret: Array<Chatsound> = [];

		const ctxModifiers = this.parseContextModifiers(input);
		for (const ctx of ctxModifiers) {
			ret = ret.concat(this.parseContext(ctx));
		}

		return ret;
	}

	// this only returns the lowest level context modifiers as a flat array
	// to access the higher level modifiers use the parentContext property
	private parseContextModifiers(input: string): Array<ChatsoundContextModifier> {
		// look for "(" and ")" because they create contextual modifiers
		if (!input.match(/\(\)/g)) return [new ChatsoundContextModifier(input, [])];

		const ret: Array<ChatsoundContextModifier> = [];
		// TODO
		// REVERSE TREE PARSING BUT ONLY RETURN LOWEST LEVEL NODES
		return [];
	}

	private parseModifiers() {
		// TODO
		// PARSE LEGACY MODIFIERS
	}

	private parseContext(ctx: ChatsoundContextModifier): Array<Chatsound> {
		const ret: Array<Chatsound> = [];
		const words = ctx.input.split(" ");
		const ctxModifiers = ctx.getAllModifiers();

		let input: string = ctx.input;
		let end: number = input.length;
		while (input.length >= 0) {
			const chunk: string = input.substring(0, end);
			const chatsoundUrl: string | undefined = this.lookup.get(chunk);
			if (chatsoundUrl) {
				const chatsound: Chatsound = new Chatsound(chunk, chatsoundUrl);
				chatsound.modifiers = chatsound.modifiers.concat(ctxModifiers); // add the context modifiers

				ret.push(chatsound);

				// remove the parsed chatsound and reset our processing vars
				// so it's not parsed twice
				input = input.substring(end, input.length);
				end = input.length;
			} else {
				end--;

				// if that happens we matched nothing from where we started
				// so start from the next word
				if (end <= 0) {
					words.shift();

					input = words.join(" ")
					end = input.length;
				}
			}
		}

		return ret;
	}
}
