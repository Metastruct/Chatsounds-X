import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import WebAudio from "./webaudio/WebAudio";

async function exampleStream(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}

function exampleParse(input: string): Array<Chatsound> {
	const lookup: Map<string, string> = new Map<string, string>();
	const parser: ChatsoundsParser = new ChatsoundsParser(lookup);
	const chatsounds: Array<Chatsound> = parser.parse(input);
	for (const cs of chatsounds) {
		console.log(cs);
	}

	return chatsounds;
}

exampleParse("awdwad^50 lol%25 (h why are we still here):pitch(-1) hello there:echo");