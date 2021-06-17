import WebAudio from "./webaudio/WebAudio";

async function example(): Promise<void> {
	const webAudio: WebAudio = new WebAudio();

	const stream = await webAudio.createStream("identifier", "https://google.com");
	stream.play();

	webAudio.close();
}
