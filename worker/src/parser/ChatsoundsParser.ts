import { ChatsoundsLookup } from "..";
import Chatsound from "./Chatsound";
import { ChatsoundContextModifier as ChatsoundModifierContext, IChatsoundModifier } from "./ChatsoundModifier";
import * as modifiers from "./modifiers";

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

export default class ChatsoundsParser {
	private lookup: ChatsoundsLookup;
	private modifierLookup: Map<string, any>;
	private pattern: RegExp;

	constructor(lookup: ChatsoundsLookup) {
		this.lookup = lookup;
		this.modifierLookup = new Map<string, any>();
		this.pattern = /./;

		const modifierClasses = Object.entries(modifiers);
		this.buildModifierLookup(modifierClasses);
		this.buildModifierPatterns(modifierClasses);
	}

	private buildModifierLookup(modifierClasses: Array<any>): void {
		for (const [_, modifierClass] of modifierClasses) {
			const modifier: IChatsoundModifier = new modifierClass();
			if (modifier.legacyCharacter) {
				this.modifierLookup.set(modifier.legacyCharacter, modifierClass);
			}

			if (modifier.name.length > 0) {
				this.modifierLookup.set(modifier.name, modifierClass);
			}
		}
	}

	private buildModifierPatterns(modifierClasses: Array<any>): void {
		const instances: Array<IChatsoundModifier> = modifierClasses.map(x => new x[1]());
		const modernPattern: string = "\\)?:(" + instances
			.filter(modifier => modifier.name.length > 0)
			.map(modifier => modifier.name)
			.join("|") + ")(\\(([0-9.\\s,-]+)\\))?";
		const legacyPattern: string = "\\)?(" + instances
			.filter(modifier => modifier.legacyCharacter)
			.map(modifier => modifier.escapeLegacy ? "\\" + modifier.legacyCharacter : modifier.legacyCharacter)
			.join("|") + ")([0-9]+)?";

		this.pattern = new RegExp(`(?:${modernPattern})|(?:${legacyPattern})`, "giu");
	}

	private tryGetModifier(regexResult: RegExpMatchArray): IChatsoundModifier | undefined {
		const modifierName: string = regexResult[1];
		let modifierClass = this.modifierLookup.get(modifierName);
		if (modifierClass) {
			const modifier = new modifierClass();
			if (regexResult[3]) {
				const args: Array<string> = regexResult[3].split(",").map(chunk => chunk.trim());
				modifier.process(args);
			}

			return modifier;
		}

		const legacyChar: string = regexResult[4];
		modifierClass = this.modifierLookup.get(legacyChar);
		if (modifierClass) {
			const arg: string = regexResult[5];
			const modifier = new modifierClass();
			modifier.process([arg]);
			return modifier;
		}

		return undefined;
	}

	public parse(input: string): Array<Chatsound> {
		let ret: Array<Chatsound> = [];
		const ctxs: Array<ChatsoundModifierContext> = this.parseModifierContexts(input);
		for (const ctx of ctxs) {
			ret = ret.concat(this.parseContext(ctx));
		}

		return ret;
	}

	private parseModifierContexts(input: string, parentCtx?: ChatsoundModifierContext): Array<ChatsoundModifierContext> {
		let ret: Array<ChatsoundModifierContext> = [];
		let start: number = 0;
		let lastCtx: ChatsoundModifierContext | undefined = undefined;
		for (const match of input.matchAll(this.pattern)) {
			if (!match.index) continue;

			const matchLen: number = match[0].length;
			const modifier: IChatsoundModifier | undefined = this.tryGetModifier(match);
			const modifiersToAdd: Array<IChatsoundModifier> = modifier ? [modifier] : [];
			const precedingChunk: string = input.substring(start, match.index);

			// if we chain modifiers, add them to the last proper context
			if (precedingChunk.trim().length === 0) {
				console.debug(modifier, lastCtx);
				if (modifier && lastCtx) {
					lastCtx.modifiers.push(modifier);
				}

				continue;
			}

			if (precedingChunk.match(/\)\s*/)) {
				const index: number = precedingChunk.lastIndexOf("(");
				const subChunk: string = input.substr(index, match.index);
				const ctx: ChatsoundModifierContext = new ChatsoundModifierContext(subChunk, modifiersToAdd);
				if (parentCtx) {
					ctx.parentContext = parentCtx;
					parentCtx.isParent = true;
				}

				ret = ret.concat(this.parseModifierContexts(subChunk, ctx));
				lastCtx = ctx;
			} else {
				const ctx: ChatsoundModifierContext = new ChatsoundModifierContext(precedingChunk, modifiersToAdd);
				if (parentCtx) {
					ctx.parentContext = parentCtx;
					parentCtx.isParent = true;
				}

				ret.push(ctx);
				lastCtx = ctx;
			}

			start = match.index + matchLen;
		}

		const lastChunk: string = input.substring(start, input.length);
		const ctx: ChatsoundModifierContext = new ChatsoundModifierContext(lastChunk, []);
		if (parentCtx) {
			ctx.parentContext = parentCtx;
			parentCtx.isParent = true;
		}

		ret.push(ctx);

		return ret.filter(ctx => !ctx.isParent);
	}

	private parseContext(ctx: ChatsoundModifierContext): Array<Chatsound> {
		const ret: Array<Chatsound> = [];
		const modifiers: Array<IChatsoundModifier> = ctx.getAllModifiers();

		const selects: Array<IChatsoundModifier> = modifiers.filter(m => m.legacyCharacter === "#");
		const selectValue: number = selects.length > 0 ? selects[selects.length - 1].value : 0;

		let words: Array<string> = ctx.content.split(" ");
		let end: number = words.length;
		while (words.length > 0) {
			const chunk: string = words.slice(0, end).join(" ");
			const chatsoundUrls: Array<string> | undefined = this.lookup[chunk];
			if (chatsoundUrls && chatsoundUrls.length > 0) {
				let internalSelectValue: number = selectValue;
				if (selectValue >= chatsoundUrls.length) internalSelectValue = chatsoundUrls.length - 1;
				if (selectValue === 0) internalSelectValue = Math.floor(chatsoundUrls.length * Math.random());

				const chatsound: Chatsound = new Chatsound(chunk, chatsoundUrls[internalSelectValue]);
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