import Chatsound from "./Chatsound";
import { ChatsoundContextModifier as ChatsoundModifierContext, IChatsoundModifier } from "./ChatsoundModifier";

export default class ChatsoundsParser {
	private lookup: Map<string, string>;

	constructor(lookup: Map<string, string>) {
		this.lookup = lookup;
	}

	/*
		CURRENT IMPL:
			1) Parse contexual modifiers e.g (awdawd):echo(0, 1)
			2) Parse chatsound in the context of the modifier
			3) Apply the context modifiers to each chatsound
			4) Repeat 1) 2) 3) until theres nothing left to parse
			5) return the list of parsed chatsounds with modifiers applied to them

		PROBLEMS:
			- Legacy modifiers are chatsound-aware but not context-aware, meaning they always use the last chatsound parsed
			- Contextual modifiers can be used in a legacy fashion: awdawd:echo
			- Arguments for contextual modifiers also contain parenthesis and can have spaces
			- Lua expressions in contextual modifiers

		POSSIBLE SOLUTION:
			Have a list of modifiers with their names, build a global regex out of the names and patterns for these modifiers
			For each match we parse the string for chatsound before the modifiers word per word
			If the the first character before the modifier is ")" we apply the modifier to each chatsound parsed up until we find "("
			If there is no ")" then apply the modifier only to the last chatsound parsed
			Return the list of parsed chatsounds along with their modifiers

		=> TODO
		-> Implement lookup table for sounds / urls
		-> Implement modifiers

	*/

	// EXPERIMENTAL
	public parse(input: string): Array<Chatsound> {
		let ret: Array<Chatsound> = [];

		const modifierContexts: Array<ChatsoundModifierContext> = this.parseModifiers(input);
		for (const ctx of modifierContexts) {
			ret = ret.concat(this.parseContext(ctx));
		}

		return ret;
	}

	// EXPERIMENTAL
	private parseModifiers(input: string): Array<ChatsoundModifierContext> {
		// look for "(" and ")" because they create contextual modifiers
		if (!input.match(/\(\)/g)) return [new ChatsoundModifierContext(input, [])];

		const ret: Array<ChatsoundModifierContext> = [];

		let depth: number = 0;
		let depthTmp: Map<number, ChatsoundModifierContext> = new Map<number, ChatsoundModifierContext>();
		let isModifier: boolean = false;
		let lastCtx: ChatsoundModifierContext | undefined = undefined;
		for (let i = 0; i < input.length; i++) {
			const char: string = input[i];

			if (!isModifier) {
				if (char === "(") {
					depth++;
				} else if (char === ")") {
					depth--;

					const ctx: ChatsoundModifierContext | undefined = depthTmp.get(depth);
					lastCtx = ctx;
					if (ctx) {
						ctx.parentContext = depthTmp.get(depth - 1);
						ret.push(ctx);
						depthTmp.delete(depth);
					}
				}
			}

			const ctx: ChatsoundModifierContext = depthTmp.get(depth) ?? new ChatsoundModifierContext("", []);
			ctx.content += char;
			depthTmp.set(depth, ctx);
		}

		return ret;
	}

	// EXPERIMENTAL
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