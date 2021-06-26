import Chatsound from "./parser/Chatsound";
import ChatsoundsParser from "./parser/ChatsoundsParser";
import * as Tone from "tone";

type ChatsoundQuery = { input: string, lookup: ChatsoundsLookup };
type ChatsoundResponse<T> = { success: boolean, result?: T, error?: string };
export type ChatsoundsLookup = { [key: string]: Array<string> }

document.body.click();

async function sleep(ms: number): Promise<void> {
	return new Promise<void>(resolve => {
		setTimeout(() => resolve(), ms);
	});
}

async function handleChatsoundsAudio(chatsounds: Array<Chatsound>): Promise<void> {
	await Tone.start();

	const bufferNodes = chatsounds.map(cs => ({ buffer: new Tone.Buffer(cs.url), modifiers: cs.modifiers }));
	for (const node of bufferNodes) {
		const buffer = await new Promise<Tone.ToneAudioBuffer>(resolve => node.buffer.onload = resolve);
		const ply = new Tone.Player(buffer).toDestination();

		for (const modifier of node.modifiers) {
			modifier.processAudio(ply);
		}

		ply.start();

		// very weird behavior here, it seems I cant use any asynchronous stuff
		// to await for the end of the chatsound for some reason
		// it also doesn't play half the time
		while (ply.state !== "stopped") {
			//await sleep(100);
		}
	}
}

(window as any).LAST_QUERY = "";
function streamHandler(queryString: string): ChatsoundResponse<string> {
	try {
		(window as any).LAST_QUERY = queryString;

		const query: ChatsoundQuery = JSON.parse(queryString);
		const parser: ChatsoundsParser = new ChatsoundsParser(query.lookup);
		const chatsounds: Array<Chatsound> = parser.parse(query.input);

		handleChatsoundsAudio(chatsounds);

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