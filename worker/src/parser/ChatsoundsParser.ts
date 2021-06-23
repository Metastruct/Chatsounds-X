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
	private modifierLookup: Map<string, () => IChatsoundModifier>;
	private pattern: RegExp;

	constructor(lookup: ChatsoundsLookup) {
		this.lookup = lookup;
		this.modifierLookup = new Map<string, () => IChatsoundModifier>();
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
		const modernPattern: string = "\\w\\)?:(" + instances
			.filter(modifier => modifier.name.length > 0)
			.map(modifier => modifier.name)
			.join("|") + ")(\\(([0-9.\\s,-]+)\\))?";//(?:\\w|\\b)";
		const legacyPattern: string = "\\w(" + instances
			.filter(modifier => modifier.legacyCharacter)
			.map(modifier => modifier.escapeLegacy ? "\\" + modifier.legacyCharacter : modifier.legacyCharacter)
			.join("|") + ")([0-9]+)?(?:\\w|\\b)";

		this.pattern = new RegExp(`(?:${modernPattern})|(?:${legacyPattern})`, "giu");
		console.debug(this.pattern);
	}

	private tryGetModifier(regexResult: RegExpMatchArray): IChatsoundModifier | undefined {
		if (!regexResult.groups) return undefined;

		const modifierName: string = regexResult.groups[1];
		let modifierClass: (() => IChatsoundModifier) | undefined = this.modifierLookup.get(modifierName);
		if (modifierClass) {
			const args: Array<string> = regexResult.groups[3].split(",").map(chunk => chunk.trim());
			const modifier: IChatsoundModifier = modifierClass();
			modifier.process(args);
			return modifier;
		}

		const legacyChar: string = regexResult.groups[4];
		modifierClass = this.modifierLookup.get(legacyChar);
		if (modifierClass) {
			const arg: string = regexResult.groups[5];
			const modifier: IChatsoundModifier = modifierClass();
			modifier.process([arg]);
			return modifier;
		}

		return undefined;
	}

	public parse(input: string): Array<Chatsound> {
		let ret: Array<Chatsound> = [];
		let hadMatches: boolean = false;
		let start: number = 0;
		for (const match of input.matchAll(this.pattern)) {
			hadMatches = true;

			const modifier: IChatsoundModifier | undefined = this.tryGetModifier(match);
			const precedingChunk: string = input.substring(start, match.index);
			if (precedingChunk.match(/\)\s*/)) {
				const index: number = precedingChunk.lastIndexOf("(");
				const subChunk: string = input.substr(index, match.index);
				//recursive logic here...
			} else {
				const ctx = new ChatsoundModifierContext(precedingChunk, modifier ? [modifier] : []);
				ret = ret.concat(this.parseContext(ctx));
				start = (match.index ? match.index : 0) + (match.length - 1);
			}
		}

		if (!hadMatches) {
			ret = this.parseContext(new ChatsoundModifierContext(input, []));
		}

		return ret;
	}

	private parseContext(ctx: ChatsoundModifierContext): Array<Chatsound> {
		const ret: Array<Chatsound> = [];
		const modifiers: Array<IChatsoundModifier> = ctx.getAllModifiers();

		let words: Array<string> = ctx.content.split(" ");
		let end: number = words.length;
		while (words.length > 0) {
			const chunk: string = words.slice(0, end).join(" ");

			const selects: Array<IChatsoundModifier> = modifiers.filter(m => m.legacyCharacter === "#");
			const selectValue: number = selects.length > 0 ? selects[selects.length - 1].value : 0;

			const chatsoundUrl: string | undefined = this.lookup[chunk][selectValue];
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