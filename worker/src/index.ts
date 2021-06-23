import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import WebAudio from "./webaudio/WebAudio";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
export type ChatsoundsLookup = { [key: string]: Array<string> }

async function exampleStream(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}

(window as any).HANDLE = (queryString: string): any => {
	const query: ChatsoundQuery = JSON.parse(queryString);
	const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
	const chatsounds: Array<Chatsound> = parser.parse(query.input);

	// return chatsounds for test purposes
	// eventually we will return an audio stream
	return chatsounds.map(cs => cs.name);
}