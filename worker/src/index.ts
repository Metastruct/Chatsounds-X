import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
type ChatsoundResponse<T> = { success: boolean, result?: T, error?: string };
export type ChatsoundsLookup = { [key: string]: Array<string> }

function streamHandler(queryString: string): ChatsoundResponse<string> {
	try {
		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		const chatsounds: Array<Chatsound> = parser.parse(query.input);

		// Trigger audio here...

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

/*fetch("http://3kv.in:6560/chatsounds/queryexample", { method: "GET" })
	.then(resp => resp.text()).then(body => handler(body));*/