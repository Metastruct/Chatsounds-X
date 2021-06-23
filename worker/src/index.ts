import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import WebAudio from "./webaudio/WebAudio";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
export type ChatsoundsLookup = { [key: string]: Array<string> }

/*async function exampleStream(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}*/

function handler(queryString: string): any {
	const query: ChatsoundQuery = JSON.parse(queryString);
	const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
	const chatsounds: Array<Chatsound> = parser.parse(query.input);

	// Trigger audio here...

	return chatsounds;
}

(window as any).HANDLE = handler;

/*fetch("http://3kv.in:6560/chatsounds/queryexample", { method: "GET" })
	.then(resp => resp.text()).then(body => handler(body));*/