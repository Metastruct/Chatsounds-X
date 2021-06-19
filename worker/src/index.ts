import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import WebAudio from "./webaudio/WebAudio";

type ChatsoundQuery = { input: string, lookup: Map<string, string> };

async function exampleStream(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}

export default function handler(query: ChatsoundQuery): Array<string> {
	const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
	const chatsounds: Array<Chatsound> = parser.parse(query.input);
	for (const cs of chatsounds) {
		console.log(cs);
	}

	return chatsounds.map(cs => cs.name);
}