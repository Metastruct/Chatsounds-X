import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import Stream from "./webaudio/Stream";
import WebAudio from "./webaudio/WebAudio";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
type ChatsoundResponse<T> = { success: boolean, result?: T, error?: string };
export type ChatsoundsLookup = { [key: string]: Array<string> }

async function streamHandler(queryString: string): Promise<ChatsoundResponse<string>> {
	try {
		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		const chatsounds: Array<Chatsound> = parser.parse(query.input);
		const webAudio: WebAudio = new WebAudio();

		const audioNodes: Array<{ chatsound: Chatsound, stream: Promise<Stream> }> = chatsounds
			.map(cs => ({ chatsound: cs, stream: webAudio.createStream(cs.name, cs.url) }));

		for (const node of audioNodes) {
			const stream: Stream = await node.stream;
			for (const modifier of node.chatsound.modifiers) {
				modifier.processStream(stream);
			}

			stream.play();
			await stream.listen();
		}

		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err.message
		};
	}
}

function parseHandler(queryString: string): ChatsoundResponse<Array<Chatsound>> {
	try {
		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		return {
			success: true,
			result: parser.parse(query.input),
		}
	} catch (err) {
		return {
			success: false,
			error: err.message,
		}
	}
}

const GLOBAL = window as any;
GLOBAL.HANDLE_STREAM = streamHandler;
GLOBAL.HANDLE_PARSE = parseHandler;