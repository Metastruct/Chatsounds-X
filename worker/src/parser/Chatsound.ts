import IChatsoundModifier from "../modifiers/IChatsoundModifier";

export default class Chatsound {
	public url: string;
	public name: string;
	public modifiers: Array<IChatsoundModifier>;

	constructor(name: string, url: string) {
		this.name = name;
		this.url = url;
		this.modifiers = [];
	}
}