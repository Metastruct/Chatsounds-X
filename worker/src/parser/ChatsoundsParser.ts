import { ChatsoundsLookup } from "..";
import Chatsound from "./Chatsound";
import * as modifiers from "../modifiers";
import IChatsoundModifier from "../modifiers/IChatsoundModifier";
import ChatsoundContextModifier from "./ChatsoundContextModifier";

/*
	PROBLEMS:
		1) Lua expressions in modifier arguments

	POSSIBLE SOLUTIONS:
		1) Implement a look-a-like JS expression processor
*/

export default class ChatsoundsParser {
	private lookup: ChatsoundsLookup;
	private modifierLookup: Map<string, any>;
	private patternStartsWith: RegExp;
	private patternIncludes: RegExp;

	constructor(lookup: ChatsoundsLookup) {
		this.lookup = lookup;
		this.modifierLookup = new Map<string, any>();
		this.patternStartsWith = /./;
		this.patternIncludes = /./;

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
		const modernPattern: string = ":(" + instances
			.filter(modifier => modifier.name.length > 0)
			.map(modifier => modifier.name)
			.join("|") + ")(\\(([0-9.\\s,-]+)\\))?";
		const legacyPattern: string = "(" + instances
			.filter(modifier => modifier.legacyCharacter)
			.map(modifier => modifier.escapeLegacy ? modifier.legacyCharacter?.split("").map(char => "\\" + char).join() : modifier.legacyCharacter)
			.join("|") + ")([0-9.]+)";

		this.patternStartsWith = new RegExp(`^(?:${modernPattern})|^(?:${legacyPattern})`, "giu");
		this.patternIncludes = new RegExp(`(?:${modernPattern})|(?:${legacyPattern})`, "giu");
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

	public parse(input: string): Array<Chatsound> {
		let chatsounds: Array<Chatsound> = [];

		const contexts: Array<ChatsoundContextModifier> = this.parseContexts(input);
		for (const ctx of contexts) {
			chatsounds = chatsounds.concat(this.parseProcessedContext(ctx));
		}

		return chatsounds;
	}

	// returns the parsed modifier along with the total length for all the modifiers parsed in the string
	private parseModifiers(input: string, startIndex: number): [Array<IChatsoundModifier>, number] {
		const modifiers: Array<IChatsoundModifier> = []

		let start: number = startIndex;
		while (true) {
			const match: RegExpMatchArray | null = this.patternStartsWith.exec(input.substring(start, input.length));
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

		return [modifiers, start - startIndex];
	}

	private getLastDelimiterIndex(input: string): number {
		const matches: Array<RegExpMatchArray> = Array.from((input).matchAll(this.patternIncludes));
		if (matches.length === 0) return -1;

		const lastModifierMatch: RegExpMatchArray = matches[matches.length - 1];
		if (!lastModifierMatch || !lastModifierMatch.index) return -1;

		const chunkStartIndex: number = lastModifierMatch.index + lastModifierMatch[0].length;
		const chunk: string = input.substring(chunkStartIndex);
		const chunkScopeIndex: number = chunk.lastIndexOf("(");
		if (chunkScopeIndex === -1) return chunkStartIndex + 1;

		return chunkStartIndex + chunkScopeIndex + 1;
	}

	private parseContexts(input: string): Array<ChatsoundContextModifier> {
		const contexts: Array<ChatsoundContextModifier> = [];

		const volMarksMatch: RegExpMatchArray | null = input.match(/[!1]+$/);
		if (volMarksMatch) {
			const len: number = volMarksMatch[0].length;
			input = `(${input.substring(0, input.length - len)}):volume(${Math.min(100 + len * 20, 300)})`;
		}

		let depthCache: Map<number, ChatsoundContextModifier> = new Map<number, ChatsoundContextModifier>();
		let curDepth: number = 0;
		for (let i = 0; i < input.length; i++) {
			const char: string = input[i];

			let ctx: ChatsoundContextModifier | undefined = depthCache.get(curDepth);
			if (!ctx) {
				ctx = new ChatsoundContextModifier();
				ctx.setScoped(true);
				depthCache.set(curDepth, ctx);
			}

			if (char === "(") {
				curDepth++;
			} else if (char === ")" || i >= input.length - 1) {
				// if we are at the end, add the last char
				if (char !== ")") {
					ctx.append(char);
				}

				// finalize parsing for the context that we've been processing
				const [modifiers, len] = this.parseModifiers(input, i + 1);
				if (modifiers.length > 0) {
					ctx.addModifiers(modifiers);

					// skip the chars that are part of the modifiers
					i = i + len;
				}

				const parentCtx: ChatsoundContextModifier | undefined = depthCache.get(curDepth - 1);
				if (parentCtx) {
					parentCtx.content = parentCtx.content.substring(ctx.content.length);
					ctx.parentContext = parentCtx;
				}

				contexts.push(ctx);
				depthCache.delete(curDepth);
				curDepth--;
			} else {
				ctx.append(char);

				// we check in case we have a modifier thats not part of a scope
				const [modifiers, len] = this.parseModifiers(input, i + 1);
				if (modifiers.length > 0) {
					let index: number = this.getLastDelimiterIndex(input.substring(0, i));
					if (index === -1) {
						index = 0;
					}

					const chunk: string = input.substring(index, i + 1).replace(")", "").replace("(", "").trim();
					const newCtx: ChatsoundContextModifier = new ChatsoundContextModifier(chunk, modifiers, false);
					ctx.content = ctx.content.substring(chunk.length);
					newCtx.parentContext = ctx;

					contexts.push(newCtx);

					// skip the chars that are part of the modifiers
					i = i + len;
				}
			}
		}

		return contexts;
	}

	private applyModifiers(chatsounds: Array<Chatsound>, modifiers: Array<IChatsoundModifier>): void {
		const lastChatsound: Chatsound = chatsounds[chatsounds.length - 1];
		for (const modifier of modifiers) {
			if (!modifier.isScoped) {
				if (lastChatsound) {
					lastChatsound.modifiers.push(modifier);
				}
			} else {
				for (const chatsound of chatsounds) {
					chatsound.modifiers.push(modifier);
				}
			}
		}
	}

	private parseProcessedContext(ctx: ChatsoundContextModifier): Array<Chatsound> {
		const chatsounds: Array<Chatsound> = [];
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
				chatsounds.push(chatsound);

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

		this.applyModifiers(chatsounds, modifiers);
		return chatsounds;
	}
}