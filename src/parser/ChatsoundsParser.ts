import Chatsound from "./Chatsound";
import { ChatsoundContextModifier as ChatsoundModifierContext, IChatsoundModifier } from "./ChatsoundModifier";

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

		const modifierContexts: Array<ChatsoundModifierContext> = this.parseModifiers(input);
		for (const ctx of modifierContexts) {
			ret = ret.concat(this.parseContext(ctx));
		}

		return ret;
	}

	// this only returns the lowest level context modifiers as a flat array
	// to access the higher level modifiers use the parentContext property
	private parseModifiers(input: string): Array<ChatsoundModifierContext> {
		// look for "(" and ")" because they create contextual modifiers
		if (!input.match(/\(\)/g)) return [new ChatsoundModifierContext(input, [])];

		const ret: Array<ChatsoundModifierContext> = [];

		let depth: number = 0;
		for (let i = 0; i < input.length; i++) {
			const char: string = input[i];

			// probably need to parse everything parenthesis-wise into chunks
			// then make sense out of each of them (?)

			/*if (char === ")") {
				depth++;
			}

			if (char === ")") {
				depth--;

				const nextChar: string = input[i + 1];
				if (nextChar === ":") {

				}
			}*/
		}

		return [];
	}

	private parseLegacyModifiers() {
		// TODO
		// PARSE LEGACY MODIFIERS
	}

	private parseContext(ctx: ChatsoundModifierContext): Array<Chatsound> {
		const ret: Array<Chatsound> = [];
		const modifiers: Array<IChatsoundModifier> = ctx.getAllModifiers();

		let words: Array<string> = ctx.content.split(" ");
		let end: number = words.length;
		while (words.length > 0) {
			const chunk: string = words.slice(0, end).join(" ");
			const chatsoundUrl: string | undefined = this.lookup.get(chunk);
			if (chatsoundUrl) {
				const chatsound: Chatsound = new Chatsound(chunk, chatsoundUrl);
				chatsound.modifiers = chatsound.modifiers.concat(modifiers); // add the context modifiers

				ret.push(chatsound);

				// remove the parsed chatsound and reset our processing vars
				// so it's not parsed twice
				words = words.slice(end, words.length);
				end = words.length;
			} else {
				end--;

				// if that happens we matched nothing from where we started
				// so start from the next word
				if (end <= 0) {
					words.shift();
					end = words.length;
				}
			}
		}

		return ret;
	}
}