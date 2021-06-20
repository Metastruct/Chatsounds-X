import axios from "axios";
import msgpack from "msgpack";

type ChatsoundRef = { path?: string, base_path?: string };
type ChatsoundsTree<T> = Map<string, Map<string, T>>;
//type TreeStuff = { SOUND_DATA?: { trigger: string, realms: Map<string, { sounds: Array<string>, realm: string }> } }

export default class ChatsoundsFetcher {
	private tree: ChatsoundsTree<ChatsoundRef>;
	private list: ChatsoundsTree<string>;

	constructor() {
		this.tree = new Map<string, Map<string, ChatsoundRef>>();
		this.list = new Map<string, Map<string, string>>();
	}

	public async fetch(): Promise<void> {
		await Promise.all([
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "csgo"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "css"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "ep1"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "ep2"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "hl1"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "hl2"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "l4d"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "l4d2"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "portal"),
			this.buildFromGithub("PAC3-Server/chatsounds-valve-games", "tf2"),
			this.buildFromGithub("PAC3-Server/chatsounds"),
			this.buildFromGithub("Metastruct/garrysmod-chatsounds", "sound/chatsounds/autoadd")
		]);
	}

	private tableToTree<T>(inputTree: ChatsoundsTree<T>): ChatsoundsTree<T> {
		/*const tree: Map<string, TreeStuff> = new Map<string, TreeStuff>();

		for (const [realm, list] of tbl) {
			for (const [trigger, sounds] of list) {
				const words = [];
				for (const word of (trigger + " ").matchAll(/(.-)\s+/g)) {
					words.push(word);
				}

				const max = words.length;
				let next: Map<string, TreeStuff> | TreeStuff | undefined = tree;
				for (let i = 0; i < words.length; i++) {
					if (!next) break;

					const word = words[i].toString();
					if (!next.has(word)) {
						next.set(word, {});
					}

					if (i === max) {
						const soundData = next.get(word)?.SOUND_DATA ?? { trigger: trigger, realms: new Map<string, any>() };
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

		return tree;*/

		return inputTree;
	}

	private readList(baseUrl: string, sounds: Array<Array<string>>): void {
		let tree: ChatsoundsTree<ChatsoundRef> = new Map<string, Map<string, ChatsoundRef>>();
		let list: ChatsoundsTree<string> = new Map<string, Map<string, string>>();

		for (let i = 1; i < sounds.length; i++) {
			const realm: string = sounds[i][1];
			const trigger: string = sounds[i][2];
			const path: string = sounds[i][3];
			const triggerUrl: string = sounds[i][4];

			if (!triggerUrl) {
				const treeRef: Map<string, ChatsoundRef> = tree.get(realm) ?? new Map<string, ChatsoundRef>();
				treeRef.set(trigger, { path: path, base_path: baseUrl });
				tree.set(realm, treeRef);

				const listRef: Map<string, string> = list.get(realm) ?? new Map<string, string>();
				listRef.set(trigger, path);
				list.set(realm, listRef);
			}
		}

		tree = this.tableToTree(tree);
		this.tree = new Map([...this.tree, ...tree]);
		this.list = new Map([...this.list, ...list]);
	}

	private async buildFromGithub(repo: string, location?: string): Promise<void> {
		location = location ?? "sounds/chatsounds";

		const baseUrl: string = `https://raw.githubusercontent.com/${repo}/master/${location}/`;
		try {
			const resp = await axios.get(baseUrl + "list.msgpack");
			const sounds: Array<Array<string>> = msgpack.unpack(resp.data);
			this.readList(baseUrl, sounds);
		} catch (err) {
			//console.log(err.message);
			const url: string = `https://api.github.com/repos/${repo}/git/trees/master?recursive=1`;
			await axios.get(url);
			/*
			local cached_path = "cache/" .. crypto.CRC32(url .. location) .. ".chatsounds_tree"
			local sounds = serializer.ReadFile("msgpack", cached_path)

			if not etag_updated and sounds then
				if sounds[1] and #sounds[1] >= 3 then
					read_list(base_url, sounds)
					return
				-- else
				-- 	llog("found cached list but format doesn't look right, regenerating.")
				end
			end


			local sounds = {}
			local str = assert(io.open(path, "rb"):read("*all"))
			local i = 1
			for path in str:gmatch('"path":%s?"(.-)"[\n,}]') do
				if path:startswith(location) and path:endswith(".ogg") then
					path = path:sub(#location + 2) -- start character after location, and another /

					local tbl = path:split("/")
					local realm = tbl[1]
					local trigger = tbl[2]

					if not tbl[3] then
						trigger = trigger:sub(1, -#".ogg" - 1)
					end

					sounds[i] = {
						realm,
						trigger,
						path,
					}

					if trigger:startswith("-") then
						sounds[i][2] = sounds[i][2]:sub(2)
						sounds[i][4] = realm .. "/" .. trigger .. ".txt"
					end

					i = i + 1
				end
			end

			serializer.WriteFile("msgpack", cached_path, sounds)

			read_list(base_url, sounds)*/
		}
	}

	public getTree(): ChatsoundsTree<ChatsoundRef> {
		return this.tree;
	}

	public getList(): ChatsoundsTree<string> {
		return this.list;
	}
}