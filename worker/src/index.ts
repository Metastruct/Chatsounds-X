import ChatsoundsAudioController from "./audio/ChatsoundsAudioController";
import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import { io, Socket } from "socket.io-client";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup, id: string };
type ChatsoundResponse<T> = { success: boolean, result?: T, error?: string };
export type ChatsoundsLookup = { [key: string]: Array<string> }

//const socket: Socket = io("ws://localhost:6560/internal/stream").connect();
const audioController: ChatsoundsAudioController = new ChatsoundsAudioController();
function streamHandler(queryString: string): ChatsoundResponse<string> {
	try {
		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		const chatsounds: Array<Chatsound> = parser.parse(query.input);

		const stream = audioController.process(chatsounds);
		/*if (socket.connected) {
			socket.emit("audio", stream, { id: query.id });
		} else {
			socket.once("connect", () => socket.emit("audio", stream, { id: query.id }));
		}*/

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