import Stream from "../../webaudio/Stream";
import { IChatsoundModifier } from "../ChatsoundModifier";

export default class EchoModifier implements IChatsoundModifier {
	name: string = "echo";
	value: [number, number] = [0, 0];
	isScoped: boolean = false;

	private castArgToNum(input: string): number {
		const n: number = parseFloat(input);
		if (isNaN(n)) return 0;
		if (n < 0) return 0;

		return n;
	}

	process(strArgs: Array<string>): void {
		this.value = [this.castArgToNum(strArgs[0]), this.castArgToNum(strArgs[1])];
	}

	processStream(stream: Stream): void {
		stream.setUseEcho(true);
		stream.setEchoDelay(this.value[1]);
		stream.echoFeedback = this.value[0];
	}
}