import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import WebAudio from "./webaudio/WebAudio";

type ChatsoundReference = { name: string, url: string };
type ChatsoundQuery = { input: string, refs: Array<ChatsoundReference> };

async function exampleStream(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}

function referenceArrayToLookup(refs: Array<ChatsoundReference>): Map<string, string> {
	// TODO
	// impl array to lookup map for chatsounds

	return new Map<string, string>();
}

(window as any).HANDLE = (queryString: string): Array<string> => {
	const query: ChatsoundQuery = JSON.parse(queryString);
	const parser: ChatsoundsParser = new ChatsoundsParser(referenceArrayToLookup(query.refs));
	const chatsounds: Array<Chatsound> = parser.parse(query.input);

	// return chatsounds for test purposes
	// eventually we will return an audio stream
	return chatsounds.map(cs => cs.name);
}