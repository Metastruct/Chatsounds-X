import axios from "axios";
import log from "./log";
import { decode } from "@msgpack/msgpack";

export type ChatsoundsLookup = { [key: string]: Array<string> }
type ChatsoundGitHubSource = { repo: string, msgpack: boolean, location: string };
type ChatsoundRef = { path?: string, basePath?: string };

class ChatsoundsTreeNode extends Map<string, ChatsoundsTreeNode> {
	SOUND_DATA?: {
		trigger: string,
		realms: Map<string, { sounds: Array<string>, realm: string }>
	}
}

class ChatsoundsTree<T> extends Map<string, Map<string, T>> {
	public toJson(): string {
		let jsonObject: any = {};
		for (const [k, v] of this) {
			jsonObject[k] = {}
			for (const [k2, v2] of v) {
				jsonObject[k][k2] = v2;
			}
		}

		return JSON.stringify(jsonObject);
	}
}

export default class ChatsoundsFetcher {
	private ghSources: Array<ChatsoundGitHubSource>;
	private tree: ChatsoundsTree<ChatsoundsTreeNode>;
	private list: ChatsoundsTree<string>;
	private lookup: ChatsoundsLookup;
	private ignoreFetchUntil: number;

	constructor(ghSources: Array<ChatsoundGitHubSource>) {
		this.ghSources = ghSources;
		this.tree = new ChatsoundsTree<ChatsoundsTreeNode>();
		this.list = new ChatsoundsTree<string>();
		this.lookup = {};
		this.ignoreFetchUntil = -1;
	}

	public async fetch(): Promise<void> {
		const now: number = Date.now();
		if (this.ignoreFetchUntil !== -1 && now < this.ignoreFetchUntil) return;

		log(`Fetching GitHub sounds...`);
		let count: number = 0;
		for (const source of this.ghSources) {
			try {
				await this.buildFromGithub(source.repo, source.msgpack, source.location.length === 0 ? undefined : source.location);
				log(`Fetched successfully [ ${++count} / ${this.ghSources.length} ]`);
			} catch(err) {
				if (err.message.endsWith("code 403")) {
					// if we get rate-limited don't fetch again for an hour
					this.ignoreFetchUntil = now + (1000 * 60 * 60);
					log("Rate-limited by GitHub! Not updating for an hour!");
					return;
				}

				log(`Failed to fetch chatsounds at \'${source.repo}/${source.location}\': ${err.message}`);
			}
		}

		this.lookup = {};
		for (const [_, trigger] of this.list) {
			for (const [name, url] of trigger) {
				if (!this.lookup[name]) {
					this.lookup[name] = [ url ];
				} else {
					this.lookup[name].push(url);
				}
			}
		}
	}

	private tableToTree<T>(inputTree: ChatsoundsTree<T>): ChatsoundsTree<ChatsoundsTreeNode> {
		const tree: ChatsoundsTree<ChatsoundsTreeNode> = new ChatsoundsTree<ChatsoundsTreeNode>();

		for (const [realm, list] of inputTree) {
			for (const [trigger, sounds] of list) {
				const words: Array<string> = [];
				for (const word of (trigger + " ").split(" ")) {
					words.push(word);
				}

				const max: number = words.length;
				let next: Map<string, ChatsoundsTreeNode> | undefined = tree;
				for (let i = 0; i < words.length; i++) {
					if (!next) break;

					const word: string = words[i].toString();
					if (!next.has(word)) {
						next.set(word, new Map<string, ChatsoundsTreeNode>());
					}

					if (i === max) {
						let soundData = { trigger: trigger, realms: new Map<string, any>() };
						const nextWord = next.get(word);
						if (nextWord && nextWord.SOUND_DATA) {
							soundData = nextWord.SOUND_DATA;
						}

						if (soundData.realms.size > 0) {
							soundData.realms.set(realm, {
								sounds: sounds,
								realm: realm,
							})
						}
					}

					next = next.get(word);
				}
			}
		}

		return tree;
	}

	private readList(baseUrl: string, sounds: Array<Array<string>>): void {
		let tree: ChatsoundsTree<ChatsoundRef> = new ChatsoundsTree<ChatsoundRef>();
		let list: ChatsoundsTree<string> = new ChatsoundsTree<string>();

		for (const sound of sounds) {
			const realm: string = sound[0];
			const trigger: string = sound[1];
			const path: string = sound[2];
			const triggerUrl: string = sound[3];

			if (!triggerUrl) {
				let treeRef: Map<string, ChatsoundRef> | undefined = tree.get(realm);
				if (treeRef === undefined) treeRef = new Map<string, ChatsoundRef>();

				treeRef.set(trigger, { path: path, basePath: baseUrl });
				tree.set(realm, treeRef);

				let listRef: Map<string, string> | undefined = list.get(realm);
				if (listRef === undefined) listRef = new Map<string, string>();

				listRef.set(trigger, baseUrl + path);
				list.set(realm, listRef);
			}
		}

		this.tree = new ChatsoundsTree([...this.tree, ...this.tableToTree(tree)]);
		this.list = new ChatsoundsTree([...this.list, ...list]);
	}

	private async buildFromGithub(repo: string, useMsgPack: boolean, location?: string): Promise<void> {
		if (location === undefined) location = "sounds/chatsounds";

		const baseUrl: string = `https://raw.githubusercontent.com/${repo}/master/${location}/`;

		if (useMsgPack) {
			//const resp = await axios.get(baseUrl + "list.msgpack");
			//const buffer: Buffer = Buffer.from(resp.data, -1);

			// msgpack is fucking taking a piss, it either returns -17 or undefined accross all the libraries I tested it with:
			// msgpack, msgpack5, msgpack-lite and node-msgpack
			// supposedly the list.msgpack are correctly generated and implementing the specs so my only conclusion is that
			// all the node.js libraries have implemented the specs incorrectly ???????????????
			// obviously for future me / other reader, it seems like caps library's implementation is wrong :)
			//const sounds: Array<Array<string>> = decode(buffer) as Array<Array<string>>;

			//this.readList(baseUrl, sounds);
		} else {
			const url: string = `https://api.github.com/repos/${repo}/git/trees/master?recursive=1`;
			const resp = await axios.get(url);
			if (resp.status === 200) {
				const body: string = JSON.stringify(resp.data);
				const sounds: Array<Array<string>> = [];
				let i: number = 0;
				for (let [_, path] of body.matchAll(/"path":"([\w\/\s]+.ogg)"(?:\n|,|})/g)) {
					if (!path || path.length === 0) continue;
					if (!path.startsWith(location) || !path.endsWith(".ogg")) continue;

					path = path.substring(location.length + 1);
					const chunks: Array<string> = path.split("/");
					const realm: string = chunks[0];
					let trigger: string = chunks[1];

					if (!chunks[2]) {
						trigger = trigger.substring(0, trigger.length - ".ogg".length);
					}

					sounds[i] = [realm, trigger, path];

					if (trigger.startsWith("-")) {
						sounds[i][1] = sounds[i][1].substring(1);
						sounds[i][3] = `${realm}/${trigger}.txt`;
					}

					i++;
				}

				this.readList(baseUrl, sounds);
			}
		}
	}

	public getList(): ChatsoundsTree<string> {
		return this.list;
	}

	public getLookup(): ChatsoundsLookup {
		return this.lookup;
	}
}