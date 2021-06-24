import { ChatsoundsLookup } from "..";
import Chatsound from "./Chatsound";
import { ChatsoundContextModifier as ChatsoundModifierContext, IChatsoundModifier } from "./ChatsoundModifier";
import * as modifiers from "./modifiers";

/*
	PROBLEMS:
		1) Lua expressions in modifier arguments
		2) Recursive contexts e.g: (h yes (im retarded):echo):pitch(-1)

	POSSIBLE SOLUTIONS:
		1) Implement a look-a-like JS expression processor
		2) Use the "(" and ")" to get the current depth, and parse accordingly (?)
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

		this.pattern = new RegExp(`^(?:${modernPattern})|(?:${legacyPattern})`, "giu");
	}

	private tryGetModifier(match: RegExpMatchArray): IChatsoundModifier | undefined {
		const modifierName: string = match[1];
		let modifierClass = this.modifierLookup.get(modifierName);
		if (modifierClass) {
			const modifier = new modifierClass();
			if (match[3]) {
				const args: Array<string> = match[3].split(",").map(chunk => chunk.trim());
				modifier.process(args);
			}

			return modifier;
		}

		const legacyChar: string = match[4];
		modifierClass = this.modifierLookup.get(legacyChar);
		if (modifierClass) {
			const arg: string = match[5];
			const modifier = new modifierClass();
			modifier.process([arg]);
			return modifier;
		}

		return undefined;
	}

	public parse(input: string): any{//Array<Chatsound> {
		let ret: Array<Chatsound> = [];
		const ctxs: Array<ChatsoundModifierContext> = this.parseContexts(input);
		for (const ctx of ctxs) {
			ret = ret.concat(this.parseProcessedContext(ctx));
		}

		return ctxs;
	}

	// returns the parsed modifier along with the total length for all the modifiers parsed in the string
	private parseModifiers(input: string, startIndex: number): [Array<IChatsoundModifier>, number] {
		const modifiers: Array<IChatsoundModifier> = []

		let start: number = startIndex;
		while (true) {
			const match: RegExpMatchArray | null = input.substring(start, input.length).match(this.pattern);
			if (match) {
				const modifier: IChatsoundModifier | undefined = this.tryGetModifier(match);
				if (modifier) {
					modifiers.push(modifier);
					start += match[0].length;
				} else {
					break;
				}
			} else {
				break;
			}
		}

		return [modifiers, start];
	}

	private getLastDelimiterIndex(input: string): number {
		const matches: Array<RegExpMatchArray> = Array.from((input).matchAll(/(^|\()/g));
		if (matches.length === 0) return -1;

		for (let i = matches.length; i >= 0; i--) {
			const match: RegExpMatchArray = matches[i];

			// if that happens then this is fundamentally broken and
			// we want nothing to do with it
			if (!match.index) return -1;

			const chunk: string = input.substring(match.index);
			if (chunk.match(/^\([0-9.\s,-]+\)/g)) continue;

			return match.index;
		}

		return -1;
	}

	// This returns the lowest level context modifiers so each potential chatsound is processed only ONCE
	// we later gather top level context modifiers and apply them to their children contexts so nothing is lost
	private parseContexts(input: string): Array<ChatsoundModifierContext> {
		const ret: Array<ChatsoundModifierContext> = [];

		input += ")"; // add a ")" to the input to finish the global scope of the input
		let depthCache: Map<number, ChatsoundModifierContext> = new Map<number, ChatsoundModifierContext>();
		let curDepth: number = 0;
		for (let i = 0; i < input.length; i++) {
			const char: string = input[i];

			let ctx: ChatsoundModifierContext | undefined = depthCache.get(curDepth);
			if (!ctx) {
				ctx = new ChatsoundModifierContext();
				ctx.isScoped = curDepth > 0;
				depthCache.set(curDepth, ctx);
			}

			if (char === "(") {
				curDepth++;
			} else if (char === ")") {
				// finalize parsing for the context that we've been processing
				const [modifiers, len] = this.parseModifiers(input, i + 1);
				if (modifiers.length > 0) {
					ctx.addModifiers(modifiers);

					// skip the chars that are part of the modifiers
					i = i + len; // -1 to account for the loop ++
				}

				const parentCtx: ChatsoundModifierContext | undefined = depthCache.get(curDepth - 1);
				if (parentCtx) {
					ctx.parentContext = parentCtx;
					parentCtx.isParent = true;
				}

				ret.push(ctx);
				depthCache.delete(curDepth);
				curDepth--;

				// we've processed global scope trigger character, finish looping
				if (curDepth < 0) break;
			}

			ctx.append(char);

			// we check in case we have a modifier thats not part of a scope
			const [modifiers, len] = this.parseModifiers(input, i + 1);
			if (modifiers.length > 0) {
				let index: number = this.getLastDelimiterIndex(input.substring(0, i));
				if (index === -1) {
					index = 0;
				}

				const chunk: string = input.substring(index, i);
				const newCtx: ChatsoundModifierContext = new ChatsoundModifierContext(chunk, modifiers, false);
				newCtx.parentContext = ctx;
				ctx.isParent = true;

				ret.push(newCtx);

				// skip the chars that are part of the modifiers
				i = i + len; // -1 to account for the loop ++
			}
		}

		return ret.filter(ctx => !ctx.isParent);
	}

	private parseProcessedContext(ctx: ChatsoundModifierContext): Array<Chatsound> {
		const ret: Array<Chatsound> = [];
		const modifiers: Array<IChatsoundModifier> = ctx.getAllModifiers();

		const selects: Array<IChatsoundModifier> = modifiers.filter(m => m.legacyCharacter === "#");
		const selectValue: number = selects.length > 0 ? selects[selects.length - 1].value : 0;

		let words: Array<string> = ctx.content.split(" ");
		let end: number = words.length;
		while (words.length > 0) {
			const chunk: string = words.slice(0, end).join(" ");
			const chatsoundUrls: Array<string> | undefined = this.lookup[chunk];
			if (chatsoundUrls && chatsoundUrls.length > 0 && chunk.length > 0) {
				let internalSelectValue: number = selectValue;
				if (selectValue >= chatsoundUrls.length) internalSelectValue = chatsoundUrls.length - 1;
				if (selectValue === 0) internalSelectValue = Math.floor(chatsoundUrls.length * Math.random());

				const chatsound: Chatsound = new Chatsound(chunk, chatsoundUrls[internalSelectValue]);
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

		if (!ctx.isScoped) {
			const lastChatsound: Chatsound = ret[ret.length - 1];
			if (lastChatsound) {
				lastChatsound.modifiers = lastChatsound.modifiers.concat(modifiers);
			}
		} else {
			for (const chatsound of ret) {
				chatsound.modifiers = chatsound.modifiers.concat(modifiers);
			}
		}

		return ret;
	}
}