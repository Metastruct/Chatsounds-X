import Chatsound from "./Chatsound";

export default class ChatsoundsParser {
	private lookup: Map<string, Chatsound>;

	constructor(lookup: Map<string, Chatsound>) {
		this.lookup = lookup;
	}

	public parse(input: string): Array<Chatsound> {
		let start: number = 0;
		let end: number = input.length;
		let components: Array<Chatsound> = [];
		while (start >= input.length || end <= start) {
			const chunk = input.substring(start, end);

			const chatsound = this.lookup.get(chunk);
			if (chatsound) {
				components.push(chatsound);
				start = start + chunk.length - 1;
			} else {
				end--;
			}
		}

		return components;
	}
}