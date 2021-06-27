import ChatsoundsAudioController from "./audio/ChatsoundsAudioController";
import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
type ChatsoundResponse<T> = { success: boolean, result?: T, error?: string };
export type ChatsoundsLookup = { [key: string]: Array<string> }

const audioController: ChatsoundsAudioController = new ChatsoundsAudioController();
function streamHandler(queryString: string): ChatsoundResponse<string> {
	try {
		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		audioController.process(parser.parse(query.input));

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