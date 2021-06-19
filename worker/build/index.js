/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ChatsoundsParser_1 = __importDefault(__webpack_require__(/*! ./parser/ChatsoundsParser */ "./src/parser/ChatsoundsParser.ts"));
const WebAudio_1 = __importDefault(__webpack_require__(/*! ./webaudio/WebAudio */ "./src/webaudio/WebAudio.ts"));
async function exampleStream() {
    const webAudio = new WebAudio_1.default();
    const stream = await webAudio.createStream("identifier", "https://google.com");
    stream.play();
    webAudio.close();
}
function exampleParse(input) {
    const lookup = new Map();
    const parser = new ChatsoundsParser_1.default(lookup);
    const chatsounds = parser.parse(input);
    for (const cs of chatsounds) {
        console.log(cs);
    }
    return chatsounds;
}
exampleParse("awdwad^50 lol%25 (h why are we still here):pitch(-1) hello there:echo");


/***/ }),

/***/ "./src/parser/Chatsound.ts":
/*!*********************************!*\
  !*** ./src/parser/Chatsound.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class Chatsound {
    constructor(name, url) {
        this.name = name;
        this.url = url;
        this.modifiers = [];
    }
}
exports.default = Chatsound;


/***/ }),

/***/ "./src/parser/ChatsoundModifier.ts":
/*!*****************************************!*\
  !*** ./src/parser/ChatsoundModifier.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatsoundContextModifier = void 0;
class ChatsoundContextModifier {
    constructor(content, modifiers) {
        this.content = content;
        this.modifiers = modifiers;
    }
    getAllModifiers() {
        let ret = [];
        let ctx = this;
        do {
            ret = ret.concat(ctx.modifiers);
            ctx = ctx.parentContext;
        } while (ctx);
        return ret;
    }
}
exports.ChatsoundContextModifier = ChatsoundContextModifier;


/***/ }),

/***/ "./src/parser/ChatsoundsParser.ts":
/*!****************************************!*\
  !*** ./src/parser/ChatsoundsParser.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Chatsound_1 = __importDefault(__webpack_require__(/*! ./Chatsound */ "./src/parser/Chatsound.ts"));
const ChatsoundModifier_1 = __webpack_require__(/*! ./ChatsoundModifier */ "./src/parser/ChatsoundModifier.ts");
const modifiers = __importStar(__webpack_require__(/*! ./modifiers */ "./src/parser/modifiers/index.ts"));
class ChatsoundsParser {
    constructor(lookup) {
        this.lookup = lookup;
        this.modifierLookup = new Map();
        this.pattern = /./;
        const modifierClasses = Object.entries(modifiers);
        this.buildModifierLookup(modifierClasses);
        this.buildModifierPatterns(modifierClasses);
    }
    buildModifierLookup(modifierClasses) {
        for (const [_, modifierClass] of modifierClasses) {
            const modifier = new modifierClass();
            if (modifier.legacyCharacter) {
                this.modifierLookup.set(modifier.legacyCharacter, modifierClass);
            }
            if (modifier.name.length > 0) {
                this.modifierLookup.set(`:${modifier.name}(`, modifierClass);
            }
        }
    }
    buildModifierPatterns(modifierClasses) {
        const instances = modifierClasses.map(x => new x[1]());
        const modernPattern = "\\w\\)?:(" + instances
            .filter(modifier => modifier.name.length > 0)
            .map(modifier => modifier.name)
            .join("|") + ")(\\(([0-9]|\\.|\\s|,|-)*\\))?(:?\\w|\\b)";
        const legacyPattern = "" + instances
            .filter(modifier => modifier.legacyCharacter)
            .map(modifier => modifier.escapeLegacy ? "\\" + modifier.legacyCharacter : modifier.legacyCharacter)
            .join("|") + "([0-9]+)?(:?\\w|\\b)";
        this.pattern = new RegExp(`(:?${modernPattern})|(:?${legacyPattern})`, "giu");
    }
    /*
        CURRENT IMPL:
            1) Parse contexual modifiers e.g (awdawd):echo(0, 1)
            2) Parse chatsound in the context of the modifier
            3) Apply the context modifiers to each chatsound
            4) Repeat 1) 2) 3) until theres nothing left to parse
            5) return the list of parsed chatsounds with modifiers applied to them

        PROBLEMS:
            - Legacy modifiers are chatsound-aware but not context-aware, meaning they always use the last chatsound parsed
            - Contextual modifiers can be used in a legacy fashion: awdawd:echo
            - Arguments for contextual modifiers also contain parenthesis and can have spaces
            - Lua expressions in contextual modifiers

        POSSIBLE SOLUTION:
            Have a list of modifiers with their names, build a global regex out of the names and patterns for these modifiers
            For each match we parse the string for chatsound before the modifiers word per word
            If the the first character before the modifier is ")" we apply the modifier to each chatsound parsed up until we find "("
            If there is no ")" then apply the modifier only to the last chatsound parsed
            Return the list of parsed chatsounds along with their modifiers

        => TODO
        -> Implement lookup table for sounds / urls
        -> Implement modifiers

    */
    tryGetModifier(regexResult) {
        if (!regexResult.groups)
            return undefined;
        const entireMatch = regexResult.groups[0];
        const modifierName = regexResult.groups[2];
        if (entireMatch.includes(":") && this.modifierLookup.has(modifierName)) {
            return this.modifierLookup.get(modifierName);
        }
        return this.modifierLookup.get(entireMatch);
    }
    parse(input) {
        let ret = [];
        let hadMatches = false;
        let start = 0;
        for (const match of input.matchAll(this.pattern)) {
            hadMatches = true;
            const modifier = this.tryGetModifier(match);
            const precedingChunk = input.substring(start, match.index);
            //if (precedingChunk.match(/\)\s*/)) {
            /*	const index: number = precedingChunk.lastIndexOf("(");
                const subChunk: string = input.substr(index, match.index);
                //recursive logic here...
            } else {*/
            const ctx = new ChatsoundModifier_1.ChatsoundContextModifier(precedingChunk, modifier ? [modifier] : []);
            ret = ret.concat(this.parseContext(ctx));
            start = (match.index ?? 0) + (match.length - 1);
            //}
        }
        if (!hadMatches) {
            ret = this.parseContext(new ChatsoundModifier_1.ChatsoundContextModifier(input, []));
        }
        return ret;
    }
    parseContext(ctx) {
        const ret = [];
        const modifiers = ctx.getAllModifiers();
        let words = ctx.content.split(" ");
        let end = words.length;
        while (words.length > 0) {
            const chunk = words.slice(0, end).join(" ");
            const chatsoundUrl = this.lookup.get(chunk);
            if (chatsoundUrl) {
                const chatsound = new Chatsound_1.default(chunk, chatsoundUrl);
                chatsound.modifiers = chatsound.modifiers.concat(modifiers); // add the context modifiers
                ret.push(chatsound);
                // remove the parsed chatsound and reset our processing vars
                // so it's not parsed twice
                words = words.slice(end, words.length);
                end = words.length;
            }
            else {
                end--;
                // if that happens we matched nothing from where we started
                // so start from the next word
                if (end <= 0) {
                    words.shift();
                    end = words.length;
                }
            }
        }
        return ret;
    }
}
exports.default = ChatsoundsParser;


/***/ }),

/***/ "./src/parser/modifiers/EchoModifier.ts":
/*!**********************************************!*\
  !*** ./src/parser/modifiers/EchoModifier.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class EchoModifier {
    constructor() {
        this.name = "echo";
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = EchoModifier;


/***/ }),

/***/ "./src/parser/modifiers/PitchModifier.ts":
/*!***********************************************!*\
  !*** ./src/parser/modifiers/PitchModifier.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class PitchModifier {
    constructor() {
        this.name = "pitch";
        this.legacyCharacter = "%";
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = PitchModifier;


/***/ }),

/***/ "./src/parser/modifiers/RealmModifier.ts":
/*!***********************************************!*\
  !*** ./src/parser/modifiers/RealmModifier.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class RealmModifier {
    constructor() {
        this.name = "realm";
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = RealmModifier;


/***/ }),

/***/ "./src/parser/modifiers/RepeatModifier.ts":
/*!************************************************!*\
  !*** ./src/parser/modifiers/RepeatModifier.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class RepeatModifier {
    constructor() {
        this.name = "rep";
        this.legacyCharacter = "*";
        this.escapeLegacy = true;
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = RepeatModifier;


/***/ }),

/***/ "./src/parser/modifiers/SelectModifier.ts":
/*!************************************************!*\
  !*** ./src/parser/modifiers/SelectModifier.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class SelectModifier {
    constructor() {
        this.name = "";
        this.legacyCharacter = "#";
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = SelectModifier;


/***/ }),

/***/ "./src/parser/modifiers/VolumeModifier.ts":
/*!************************************************!*\
  !*** ./src/parser/modifiers/VolumeModifier.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class VolumeModifier {
    constructor() {
        this.name = "volume";
        this.legacyCharacter = "^";
        this.escapeLegacy = true;
    }
    process(soundString) {
        throw new Error("Method not implemented.");
    }
}
exports.default = VolumeModifier;


/***/ }),

/***/ "./src/parser/modifiers/index.ts":
/*!***************************************!*\
  !*** ./src/parser/modifiers/index.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VolumeModifier = exports.SelectModifier = exports.RepeatModifier = exports.RealmModifier = exports.PitchModifier = exports.EchoModifier = void 0;
const EchoModifier_1 = __importDefault(__webpack_require__(/*! ./EchoModifier */ "./src/parser/modifiers/EchoModifier.ts"));
exports.EchoModifier = EchoModifier_1.default;
const PitchModifier_1 = __importDefault(__webpack_require__(/*! ./PitchModifier */ "./src/parser/modifiers/PitchModifier.ts"));
exports.PitchModifier = PitchModifier_1.default;
const RealmModifier_1 = __importDefault(__webpack_require__(/*! ./RealmModifier */ "./src/parser/modifiers/RealmModifier.ts"));
exports.RealmModifier = RealmModifier_1.default;
const RepeatModifier_1 = __importDefault(__webpack_require__(/*! ./RepeatModifier */ "./src/parser/modifiers/RepeatModifier.ts"));
exports.RepeatModifier = RepeatModifier_1.default;
const SelectModifier_1 = __importDefault(__webpack_require__(/*! ./SelectModifier */ "./src/parser/modifiers/SelectModifier.ts"));
exports.SelectModifier = SelectModifier_1.default;
const VolumeModifier_1 = __importDefault(__webpack_require__(/*! ./VolumeModifier */ "./src/parser/modifiers/VolumeModifier.ts"));
exports.VolumeModifier = VolumeModifier_1.default;


/***/ }),

/***/ "./src/webaudio/Stream.ts":
/*!********************************!*\
  !*** ./src/webaudio/Stream.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class Stream {
    constructor(buffer, audio, url) {
        this.position = 0;
        this.speed = 1; // 1 = normal pitch
        this.maxLoop = 1; // -1 = inf
        this.paused = true;
        this.donePlaying = false;
        this.reverse = false;
        // smoothing
        this.useSmoothing = true;
        // filtering
        this.filterType = 0;
        this.filterFraction = 1;
        // echo
        this.useEcho = false;
        this.echoFeedback = 0.75;
        this.echoBuffer = undefined;
        this.echoVolume = 0;
        this.echoDelay = 0;
        // volume
        this.volumeBoth = 1;
        this.volumeLeft = 1;
        this.volumeRight = 1;
        this.volumeLeftSmooth = 0;
        this.volumeRightSmooth = 0;
        // lfo
        this.lfoVolumeTime = 1;
        this.lfoVolumeAmount = 0;
        this.lfoPitchTime = 1;
        this.lfoPitchAmount = 0;
        this.buffer = buffer;
        this.audio = audio;
        this.speedSmooth = this.speed;
        this.url = url;
    }
    play() {
        this.position = 0;
        this.paused = false;
    }
    stop(position) {
        if (position !== undefined) {
            this.position = position;
        }
        this.paused = true;
    }
    useFFT(_) {
        // later
    }
    setUseEcho(enable) {
        this.useEcho = enable;
        if (enable) {
            this.setEchoDelay(this.echoDelay);
        }
        else {
            this.echoBuffer = undefined;
        }
    }
    setEchoDelay(delay) {
        if (this.useEcho && (!this.echoBuffer || delay != this.echoBuffer.length)) {
            let size = 1;
            while ((size <<= 1) < delay)
                ;
            this.echoBuffer = this.audio.createBuffer(2, size, this.audio.sampleRate);
        }
        this.echoDelay = delay;
    }
}
exports.default = Stream;


/***/ }),

/***/ "./src/webaudio/StreamFactory.ts":
/*!***************************************!*\
  !*** ./src/webaudio/StreamFactory.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Stream_1 = __importDefault(__webpack_require__(/*! ./Stream */ "./src/webaudio/Stream.ts"));
class StreamFactory {
    constructor() {
        this.bufferCache = new Map();
    }
    async downloadBuffer(audio, url, skipCache) {
        const buffer = this.bufferCache.get(url);
        if (!skipCache && buffer) {
            return buffer;
        }
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open("GET", url);
            request.responseType = "arraybuffer";
            request.send();
            request.onload = () => {
                audio.decodeAudioData(request.response, (buffer) => {
                    this.bufferCache.set(url, buffer);
                    resolve(buffer);
                }, (err) => reject(err));
            };
            request.onerror = () => reject(request.responseText);
        });
    }
    async createStream(audio, url, skipCache) {
        const buffer = await this.downloadBuffer(audio, url, skipCache);
        return new Stream_1.default(buffer, audio, url);
    }
    destroyStream(stream) {
        if (stream) {
            this.bufferCache.delete(stream.url);
        }
    }
}
exports.default = StreamFactory;


/***/ }),

/***/ "./src/webaudio/WebAudio.ts":
/*!**********************************!*\
  !*** ./src/webaudio/WebAudio.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const StreamFactory_1 = __importDefault(__webpack_require__(/*! ./StreamFactory */ "./src/webaudio/StreamFactory.ts"));
const BUFFER_SIZE = 1024;
class WebAudio {
    constructor() {
        this.streams = [];
        this.factory = new StreamFactory_1.default();
        this.streamLookup = new Map();
        this.audio = new AudioContext();
        this.processor = this.audio.createScriptProcessor(BUFFER_SIZE, 2, 2);
        this.gain = this.audio.createGain();
        this.compressor = this.audio.createDynamicsCompressor();
        this.processor.onaudioprocess = (ev) => this.onAudioProcess(ev);
        this.processor.connect(this.compressor);
        this.compressor.connect(this.gain);
        this.gain.connect(this.audio.destination);
    }
    onAudioProcess(event) {
        let outputLeft = event.outputBuffer.getChannelData(0);
        let outputRight = event.outputBuffer.getChannelData(1);
        for (let i = 0; i < event.outputBuffer.length; ++i) {
            outputLeft[i] = 0;
            outputRight[i] = 0;
        }
        for (let i = 0; i < this.streams.length; ++i) {
            const stream = this.streams[i];
            const bufferLen = stream.buffer.length;
            const bufferLeft = stream.buffer.getChannelData(0);
            const bufferRight = stream.buffer.numberOfChannels === 1
                ? bufferLeft
                : stream.buffer.getChannelData(1);
            if (stream.useSmoothing) {
                stream.speedSmooth =
                    stream.speedSmooth + (stream.speed - stream.speedSmooth) * 1;
                stream.volumeLeftSmooth =
                    stream.volumeLeftSmooth +
                        (stream.volumeLeft - stream.volumeLeftSmooth) * 1;
                stream.volumeRightSmooth =
                    stream.volumeRightSmooth +
                        (stream.volumeRight - stream.volumeRightSmooth) * 1;
            }
            else {
                stream.speedSmooth = stream.speed;
                stream.volumeLeftSmooth = stream.volumeLeftSmooth;
                stream.volumeRightSmooth = stream.volumeRightSmooth;
            }
            if (!stream.useEcho && (stream.paused || (stream.volumeLeft < 0.001 && stream.volumeRight < 0.001))) {
                continue;
            }
            let echol = [];
            let echor = [];
            if (stream.useEcho && stream.echoBuffer) {
                echol = stream.echoBuffer.getChannelData(0);
                echor = stream.echoBuffer.getChannelData(1);
            }
            let sml = 0;
            let smr = 0;
            for (let j = 0; j < event.outputBuffer.length; ++j) {
                if (stream.paused || (stream.maxLoop > 0 && stream.position > bufferLen * stream.maxLoop)) {
                    stream.donePlaying = true;
                    if (!stream.paused) {
                        stream.paused = true;
                    }
                    if (!stream.useEcho) {
                        break;
                    }
                }
                else {
                    stream.donePlaying = false;
                }
                let index = (stream.position >> 0) % bufferLen;
                if (stream.reverse) {
                    index = -index + bufferLen;
                }
                let left = 0;
                let right = 0;
                if (!stream.donePlaying) {
                    // filters
                    if (stream.filterType === 0) {
                        // None
                        left = bufferLeft[index] * stream.volumeBoth;
                        right = bufferRight[index] * stream.volumeBoth;
                    }
                    else {
                        sml = sml + (bufferLeft[index] - sml) * stream.filterFraction;
                        smr = smr + (bufferRight[index] - smr) * stream.filterFraction;
                        if (stream.filterType === 1) {
                            // Low pass
                            left = sml * stream.volumeBoth;
                            right = smr * stream.volumeBoth;
                        }
                        else if (stream.filterType === 2) {
                            // High pass
                            left = (bufferLeft[index] - sml) * stream.volumeBoth;
                            right = (bufferRight[index] - smr) * stream.volumeBoth;
                        }
                    }
                    left = Math.min(Math.max(left, -1), 1) * stream.volumeLeftSmooth;
                    right = Math.min(Math.max(right, -1), 1) * stream.volumeRightSmooth;
                }
                if (stream.lfoVolumeTime) {
                    const res = Math.sin((stream.position / this.audio.sampleRate) *
                        10 *
                        stream.lfoVolumeTime) * stream.lfoVolumeAmount;
                    left *= res;
                    right *= res;
                }
                if (stream.useEcho) {
                    const echoIndex = (stream.position >> 0) % stream.echoDelay;
                    echol[echoIndex] *= stream.echoFeedback + left;
                    echor[echoIndex] *= stream.echoFeedback + right;
                    outputLeft[j] += echol[echoIndex];
                    outputRight[j] += echor[echoIndex];
                }
                else {
                    outputLeft[j] += left;
                    outputRight[j] += right;
                }
                let speed = stream.speedSmooth;
                if (stream.lfoPitchTime) {
                    speed -=
                        Math.sin((stream.position / this.audio.sampleRate) *
                            10 *
                            stream.lfoPitchTime) * stream.lfoPitchAmount;
                    speed += Math.pow(stream.lfoPitchAmount * 0.5, 2);
                }
                stream.position += speed;
                const max = 1;
                outputLeft[j] = Math.min(Math.max(outputLeft[j], -max), max);
                outputRight[j] = Math.min(Math.max(outputRight[j], -max), max);
                if (!isFinite(outputLeft[j])) {
                    outputLeft[j] = 0;
                }
                if (!isFinite(outputRight[j])) {
                    outputRight[j] = 0;
                }
            }
        }
    }
    close() {
        this.audio.destination.disconnect();
    }
    async createStream(id, url, skipCache) {
        if (skipCache === undefined)
            skipCache = false;
        const stream = await this.factory.createStream(this.audio, url, skipCache);
        this.streamLookup.set(id, stream);
        this.streams.push(stream);
        return stream;
    }
    destroyStream(id) {
        const stream = this.streamLookup.get(id);
        if (!stream)
            return;
        this.streamLookup.delete(id);
        this.factory.destroyStream(stream);
        const index = this.streams.indexOf(stream);
        this.streams.splice(index, 1);
    }
}
exports.default = WebAudio;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL0NoYXRzb3VuZC50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRzUGFyc2VyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9FY2hvTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1BpdGNoTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlYWxtTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlcGVhdE1vZGlmaWVyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9TZWxlY3RNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9tb2RpZmllcnMvVm9sdW1lTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtRmFjdG9yeS50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3dlYmF1ZGlvL1dlYkF1ZGlvLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQSw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0QsMkNBQTJDLG1CQUFPLENBQUMsbUVBQTJCO0FBQzlFLG1DQUFtQyxtQkFBTyxDQUFDLHVEQUFxQjtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUN0QmE7QUFDYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlOzs7Ozs7Ozs7OztBQ1RGO0FBQ2IsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQzs7Ozs7Ozs7Ozs7QUNsQm5CO0FBQ2I7QUFDQTtBQUNBLGtDQUFrQyxvQ0FBb0MsYUFBYSxFQUFFLEVBQUU7QUFDdkYsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSx5Q0FBeUMsNkJBQTZCO0FBQ3RFLENBQUM7QUFDRDtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELG9DQUFvQyxtQkFBTyxDQUFDLDhDQUFhO0FBQ3pELDRCQUE0QixtQkFBTyxDQUFDLDhEQUFxQjtBQUN6RCwr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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwrQkFBK0I7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTs7Ozs7OztVQ3BLZjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kc1BhcnNlcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3BhcnNlci9DaGF0c291bmRzUGFyc2VyXCIpKTtcclxuY29uc3QgV2ViQXVkaW9fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi93ZWJhdWRpby9XZWJBdWRpb1wiKSk7XHJcbmFzeW5jIGZ1bmN0aW9uIGV4YW1wbGVTdHJlYW0oKSB7XHJcbiAgICBjb25zdCB3ZWJBdWRpbyA9IG5ldyBXZWJBdWRpb18xLmRlZmF1bHQoKTtcclxuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHdlYkF1ZGlvLmNyZWF0ZVN0cmVhbShcImlkZW50aWZpZXJcIiwgXCJodHRwczovL2dvb2dsZS5jb21cIik7XHJcbiAgICBzdHJlYW0ucGxheSgpO1xyXG4gICAgd2ViQXVkaW8uY2xvc2UoKTtcclxufVxyXG5mdW5jdGlvbiBleGFtcGxlUGFyc2UoaW5wdXQpIHtcclxuICAgIGNvbnN0IGxvb2t1cCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBDaGF0c291bmRzUGFyc2VyXzEuZGVmYXVsdChsb29rdXApO1xyXG4gICAgY29uc3QgY2hhdHNvdW5kcyA9IHBhcnNlci5wYXJzZShpbnB1dCk7XHJcbiAgICBmb3IgKGNvbnN0IGNzIG9mIGNoYXRzb3VuZHMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhjcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhdHNvdW5kcztcclxufVxyXG5leGFtcGxlUGFyc2UoXCJhd2R3YWReNTAgbG9sJTI1IChoIHdoeSBhcmUgd2Ugc3RpbGwgaGVyZSk6cGl0Y2goLTEpIGhlbGxvIHRoZXJlOmVjaG9cIik7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIENoYXRzb3VuZCB7XHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCB1cmwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIHRoaXMubW9kaWZpZXJzID0gW107XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhdHNvdW5kO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkNoYXRzb3VuZENvbnRleHRNb2RpZmllciA9IHZvaWQgMDtcclxuY2xhc3MgQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNvbnRlbnQsIG1vZGlmaWVycykge1xyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllcnMgPSBtb2RpZmllcnM7XHJcbiAgICB9XHJcbiAgICBnZXRBbGxNb2RpZmllcnMoKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGxldCBjdHggPSB0aGlzO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgcmV0ID0gcmV0LmNvbmNhdChjdHgubW9kaWZpZXJzKTtcclxuICAgICAgICAgICAgY3R4ID0gY3R4LnBhcmVudENvbnRleHQ7XHJcbiAgICAgICAgfSB3aGlsZSAoY3R4KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyID0gQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pKTtcclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19zZXRNb2R1bGVEZWZhdWx0KSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59KTtcclxudmFyIF9faW1wb3J0U3RhciA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnRTdGFyKSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vQ2hhdHNvdW5kXCIpKTtcclxuY29uc3QgQ2hhdHNvdW5kTW9kaWZpZXJfMSA9IHJlcXVpcmUoXCIuL0NoYXRzb3VuZE1vZGlmaWVyXCIpO1xyXG5jb25zdCBtb2RpZmllcnMgPSBfX2ltcG9ydFN0YXIocmVxdWlyZShcIi4vbW9kaWZpZXJzXCIpKTtcclxuY2xhc3MgQ2hhdHNvdW5kc1BhcnNlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihsb29rdXApIHtcclxuICAgICAgICB0aGlzLmxvb2t1cCA9IGxvb2t1cDtcclxuICAgICAgICB0aGlzLm1vZGlmaWVyTG9va3VwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMucGF0dGVybiA9IC8uLztcclxuICAgICAgICBjb25zdCBtb2RpZmllckNsYXNzZXMgPSBPYmplY3QuZW50cmllcyhtb2RpZmllcnMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGRNb2RpZmllckxvb2t1cChtb2RpZmllckNsYXNzZXMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGRNb2RpZmllclBhdHRlcm5zKG1vZGlmaWVyQ2xhc3Nlcyk7XHJcbiAgICB9XHJcbiAgICBidWlsZE1vZGlmaWVyTG9va3VwKG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgIGZvciAoY29uc3QgW18sIG1vZGlmaWVyQ2xhc3NdIG9mIG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgICAgICBjb25zdCBtb2RpZmllciA9IG5ldyBtb2RpZmllckNsYXNzKCk7XHJcbiAgICAgICAgICAgIGlmIChtb2RpZmllci5sZWdhY3lDaGFyYWN0ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kaWZpZXJMb29rdXAuc2V0KG1vZGlmaWVyLmxlZ2FjeUNoYXJhY3RlciwgbW9kaWZpZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1vZGlmaWVyLm5hbWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RpZmllckxvb2t1cC5zZXQoYDoke21vZGlmaWVyLm5hbWV9KGAsIG1vZGlmaWVyQ2xhc3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgYnVpbGRNb2RpZmllclBhdHRlcm5zKG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlcyA9IG1vZGlmaWVyQ2xhc3Nlcy5tYXAoeCA9PiBuZXcgeFsxXSgpKTtcclxuICAgICAgICBjb25zdCBtb2Rlcm5QYXR0ZXJuID0gXCJcXFxcd1xcXFwpPzooXCIgKyBpbnN0YW5jZXNcclxuICAgICAgICAgICAgLmZpbHRlcihtb2RpZmllciA9PiBtb2RpZmllci5uYW1lLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIC5tYXAobW9kaWZpZXIgPT4gbW9kaWZpZXIubmFtZSlcclxuICAgICAgICAgICAgLmpvaW4oXCJ8XCIpICsgXCIpKFxcXFwoKFswLTldfFxcXFwufFxcXFxzfCx8LSkqXFxcXCkpPyg6P1xcXFx3fFxcXFxiKVwiO1xyXG4gICAgICAgIGNvbnN0IGxlZ2FjeVBhdHRlcm4gPSBcIlwiICsgaW5zdGFuY2VzXHJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kaWZpZXIgPT4gbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICAubWFwKG1vZGlmaWVyID0+IG1vZGlmaWVyLmVzY2FwZUxlZ2FjeSA/IFwiXFxcXFwiICsgbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyIDogbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICAuam9pbihcInxcIikgKyBcIihbMC05XSspPyg6P1xcXFx3fFxcXFxiKVwiO1xyXG4gICAgICAgIHRoaXMucGF0dGVybiA9IG5ldyBSZWdFeHAoYCg6PyR7bW9kZXJuUGF0dGVybn0pfCg6PyR7bGVnYWN5UGF0dGVybn0pYCwgXCJnaXVcIik7XHJcbiAgICB9XHJcbiAgICAvKlxyXG4gICAgICAgIENVUlJFTlQgSU1QTDpcclxuICAgICAgICAgICAgMSkgUGFyc2UgY29udGV4dWFsIG1vZGlmaWVycyBlLmcgKGF3ZGF3ZCk6ZWNobygwLCAxKVxyXG4gICAgICAgICAgICAyKSBQYXJzZSBjaGF0c291bmQgaW4gdGhlIGNvbnRleHQgb2YgdGhlIG1vZGlmaWVyXHJcbiAgICAgICAgICAgIDMpIEFwcGx5IHRoZSBjb250ZXh0IG1vZGlmaWVycyB0byBlYWNoIGNoYXRzb3VuZFxyXG4gICAgICAgICAgICA0KSBSZXBlYXQgMSkgMikgMykgdW50aWwgdGhlcmVzIG5vdGhpbmcgbGVmdCB0byBwYXJzZVxyXG4gICAgICAgICAgICA1KSByZXR1cm4gdGhlIGxpc3Qgb2YgcGFyc2VkIGNoYXRzb3VuZHMgd2l0aCBtb2RpZmllcnMgYXBwbGllZCB0byB0aGVtXHJcblxyXG4gICAgICAgIFBST0JMRU1TOlxyXG4gICAgICAgICAgICAtIExlZ2FjeSBtb2RpZmllcnMgYXJlIGNoYXRzb3VuZC1hd2FyZSBidXQgbm90IGNvbnRleHQtYXdhcmUsIG1lYW5pbmcgdGhleSBhbHdheXMgdXNlIHRoZSBsYXN0IGNoYXRzb3VuZCBwYXJzZWRcclxuICAgICAgICAgICAgLSBDb250ZXh0dWFsIG1vZGlmaWVycyBjYW4gYmUgdXNlZCBpbiBhIGxlZ2FjeSBmYXNoaW9uOiBhd2Rhd2Q6ZWNob1xyXG4gICAgICAgICAgICAtIEFyZ3VtZW50cyBmb3IgY29udGV4dHVhbCBtb2RpZmllcnMgYWxzbyBjb250YWluIHBhcmVudGhlc2lzIGFuZCBjYW4gaGF2ZSBzcGFjZXNcclxuICAgICAgICAgICAgLSBMdWEgZXhwcmVzc2lvbnMgaW4gY29udGV4dHVhbCBtb2RpZmllcnNcclxuXHJcbiAgICAgICAgUE9TU0lCTEUgU09MVVRJT046XHJcbiAgICAgICAgICAgIEhhdmUgYSBsaXN0IG9mIG1vZGlmaWVycyB3aXRoIHRoZWlyIG5hbWVzLCBidWlsZCBhIGdsb2JhbCByZWdleCBvdXQgb2YgdGhlIG5hbWVzIGFuZCBwYXR0ZXJucyBmb3IgdGhlc2UgbW9kaWZpZXJzXHJcbiAgICAgICAgICAgIEZvciBlYWNoIG1hdGNoIHdlIHBhcnNlIHRoZSBzdHJpbmcgZm9yIGNoYXRzb3VuZCBiZWZvcmUgdGhlIG1vZGlmaWVycyB3b3JkIHBlciB3b3JkXHJcbiAgICAgICAgICAgIElmIHRoZSB0aGUgZmlyc3QgY2hhcmFjdGVyIGJlZm9yZSB0aGUgbW9kaWZpZXIgaXMgXCIpXCIgd2UgYXBwbHkgdGhlIG1vZGlmaWVyIHRvIGVhY2ggY2hhdHNvdW5kIHBhcnNlZCB1cCB1bnRpbCB3ZSBmaW5kIFwiKFwiXHJcbiAgICAgICAgICAgIElmIHRoZXJlIGlzIG5vIFwiKVwiIHRoZW4gYXBwbHkgdGhlIG1vZGlmaWVyIG9ubHkgdG8gdGhlIGxhc3QgY2hhdHNvdW5kIHBhcnNlZFxyXG4gICAgICAgICAgICBSZXR1cm4gdGhlIGxpc3Qgb2YgcGFyc2VkIGNoYXRzb3VuZHMgYWxvbmcgd2l0aCB0aGVpciBtb2RpZmllcnNcclxuXHJcbiAgICAgICAgPT4gVE9ET1xyXG4gICAgICAgIC0+IEltcGxlbWVudCBsb29rdXAgdGFibGUgZm9yIHNvdW5kcyAvIHVybHNcclxuICAgICAgICAtPiBJbXBsZW1lbnQgbW9kaWZpZXJzXHJcblxyXG4gICAgKi9cclxuICAgIHRyeUdldE1vZGlmaWVyKHJlZ2V4UmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKCFyZWdleFJlc3VsdC5ncm91cHMpXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgY29uc3QgZW50aXJlTWF0Y2ggPSByZWdleFJlc3VsdC5ncm91cHNbMF07XHJcbiAgICAgICAgY29uc3QgbW9kaWZpZXJOYW1lID0gcmVnZXhSZXN1bHQuZ3JvdXBzWzJdO1xyXG4gICAgICAgIGlmIChlbnRpcmVNYXRjaC5pbmNsdWRlcyhcIjpcIikgJiYgdGhpcy5tb2RpZmllckxvb2t1cC5oYXMobW9kaWZpZXJOYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb2RpZmllckxvb2t1cC5nZXQobW9kaWZpZXJOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kaWZpZXJMb29rdXAuZ2V0KGVudGlyZU1hdGNoKTtcclxuICAgIH1cclxuICAgIHBhcnNlKGlucHV0KSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGxldCBoYWRNYXRjaGVzID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHN0YXJ0ID0gMDtcclxuICAgICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIGlucHV0Lm1hdGNoQWxsKHRoaXMucGF0dGVybikpIHtcclxuICAgICAgICAgICAgaGFkTWF0Y2hlcyA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbnN0IG1vZGlmaWVyID0gdGhpcy50cnlHZXRNb2RpZmllcihtYXRjaCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByZWNlZGluZ0NodW5rID0gaW5wdXQuc3Vic3RyaW5nKHN0YXJ0LCBtYXRjaC5pbmRleCk7XHJcbiAgICAgICAgICAgIC8vaWYgKHByZWNlZGluZ0NodW5rLm1hdGNoKC9cXClcXHMqLykpIHtcclxuICAgICAgICAgICAgLypcdGNvbnN0IGluZGV4OiBudW1iZXIgPSBwcmVjZWRpbmdDaHVuay5sYXN0SW5kZXhPZihcIihcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJDaHVuazogc3RyaW5nID0gaW5wdXQuc3Vic3RyKGluZGV4LCBtYXRjaC5pbmRleCk7XHJcbiAgICAgICAgICAgICAgICAvL3JlY3Vyc2l2ZSBsb2dpYyBoZXJlLi4uXHJcbiAgICAgICAgICAgIH0gZWxzZSB7Ki9cclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gbmV3IENoYXRzb3VuZE1vZGlmaWVyXzEuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyKHByZWNlZGluZ0NodW5rLCBtb2RpZmllciA/IFttb2RpZmllcl0gOiBbXSk7XHJcbiAgICAgICAgICAgIHJldCA9IHJldC5jb25jYXQodGhpcy5wYXJzZUNvbnRleHQoY3R4KSk7XHJcbiAgICAgICAgICAgIHN0YXJ0ID0gKG1hdGNoLmluZGV4ID8/IDApICsgKG1hdGNoLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICAvL31cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFoYWRNYXRjaGVzKSB7XHJcbiAgICAgICAgICAgIHJldCA9IHRoaXMucGFyc2VDb250ZXh0KG5ldyBDaGF0c291bmRNb2RpZmllcl8xLkNoYXRzb3VuZENvbnRleHRNb2RpZmllcihpbnB1dCwgW10pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIHBhcnNlQ29udGV4dChjdHgpIHtcclxuICAgICAgICBjb25zdCByZXQgPSBbXTtcclxuICAgICAgICBjb25zdCBtb2RpZmllcnMgPSBjdHguZ2V0QWxsTW9kaWZpZXJzKCk7XHJcbiAgICAgICAgbGV0IHdvcmRzID0gY3R4LmNvbnRlbnQuc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgIGxldCBlbmQgPSB3b3Jkcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKHdvcmRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSB3b3Jkcy5zbGljZSgwLCBlbmQpLmpvaW4oXCIgXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBjaGF0c291bmRVcmwgPSB0aGlzLmxvb2t1cC5nZXQoY2h1bmspO1xyXG4gICAgICAgICAgICBpZiAoY2hhdHNvdW5kVXJsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGF0c291bmQgPSBuZXcgQ2hhdHNvdW5kXzEuZGVmYXVsdChjaHVuaywgY2hhdHNvdW5kVXJsKTtcclxuICAgICAgICAgICAgICAgIGNoYXRzb3VuZC5tb2RpZmllcnMgPSBjaGF0c291bmQubW9kaWZpZXJzLmNvbmNhdChtb2RpZmllcnMpOyAvLyBhZGQgdGhlIGNvbnRleHQgbW9kaWZpZXJzXHJcbiAgICAgICAgICAgICAgICByZXQucHVzaChjaGF0c291bmQpO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBwYXJzZWQgY2hhdHNvdW5kIGFuZCByZXNldCBvdXIgcHJvY2Vzc2luZyB2YXJzXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBpdCdzIG5vdCBwYXJzZWQgdHdpY2VcclxuICAgICAgICAgICAgICAgIHdvcmRzID0gd29yZHMuc2xpY2UoZW5kLCB3b3Jkcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgZW5kID0gd29yZHMubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW5kLS07XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGF0IGhhcHBlbnMgd2UgbWF0Y2hlZCBub3RoaW5nIGZyb20gd2hlcmUgd2Ugc3RhcnRlZFxyXG4gICAgICAgICAgICAgICAgLy8gc28gc3RhcnQgZnJvbSB0aGUgbmV4dCB3b3JkXHJcbiAgICAgICAgICAgICAgICBpZiAoZW5kIDw9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB3b3Jkcy5zaGlmdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IHdvcmRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IENoYXRzb3VuZHNQYXJzZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIEVjaG9Nb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcImVjaG9cIjtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBFY2hvTW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFBpdGNoTW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJwaXRjaFwiO1xyXG4gICAgICAgIHRoaXMubGVnYWN5Q2hhcmFjdGVyID0gXCIlXCI7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gUGl0Y2hNb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgUmVhbG1Nb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcInJlYWxtXCI7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gUmVhbG1Nb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgUmVwZWF0TW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJyZXBcIjtcclxuICAgICAgICB0aGlzLmxlZ2FjeUNoYXJhY3RlciA9IFwiKlwiO1xyXG4gICAgICAgIHRoaXMuZXNjYXBlTGVnYWN5ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBSZXBlYXRNb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgU2VsZWN0TW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJcIjtcclxuICAgICAgICB0aGlzLmxlZ2FjeUNoYXJhY3RlciA9IFwiI1wiO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFNlbGVjdE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBWb2x1bWVNb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcInZvbHVtZVwiO1xyXG4gICAgICAgIHRoaXMubGVnYWN5Q2hhcmFjdGVyID0gXCJeXCI7XHJcbiAgICAgICAgdGhpcy5lc2NhcGVMZWdhY3kgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFZvbHVtZU1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLlZvbHVtZU1vZGlmaWVyID0gZXhwb3J0cy5TZWxlY3RNb2RpZmllciA9IGV4cG9ydHMuUmVwZWF0TW9kaWZpZXIgPSBleHBvcnRzLlJlYWxtTW9kaWZpZXIgPSBleHBvcnRzLlBpdGNoTW9kaWZpZXIgPSBleHBvcnRzLkVjaG9Nb2RpZmllciA9IHZvaWQgMDtcclxuY29uc3QgRWNob01vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vRWNob01vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5FY2hvTW9kaWZpZXIgPSBFY2hvTW9kaWZpZXJfMS5kZWZhdWx0O1xyXG5jb25zdCBQaXRjaE1vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vUGl0Y2hNb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuUGl0Y2hNb2RpZmllciA9IFBpdGNoTW9kaWZpZXJfMS5kZWZhdWx0O1xyXG5jb25zdCBSZWFsbU1vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vUmVhbG1Nb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuUmVhbG1Nb2RpZmllciA9IFJlYWxtTW9kaWZpZXJfMS5kZWZhdWx0O1xyXG5jb25zdCBSZXBlYXRNb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1JlcGVhdE1vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5SZXBlYXRNb2RpZmllciA9IFJlcGVhdE1vZGlmaWVyXzEuZGVmYXVsdDtcclxuY29uc3QgU2VsZWN0TW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TZWxlY3RNb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuU2VsZWN0TW9kaWZpZXIgPSBTZWxlY3RNb2RpZmllcl8xLmRlZmF1bHQ7XHJcbmNvbnN0IFZvbHVtZU1vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vVm9sdW1lTW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLlZvbHVtZU1vZGlmaWVyID0gVm9sdW1lTW9kaWZpZXJfMS5kZWZhdWx0O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBTdHJlYW0ge1xyXG4gICAgY29uc3RydWN0b3IoYnVmZmVyLCBhdWRpbywgdXJsKSB7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IDA7XHJcbiAgICAgICAgdGhpcy5zcGVlZCA9IDE7IC8vIDEgPSBub3JtYWwgcGl0Y2hcclxuICAgICAgICB0aGlzLm1heExvb3AgPSAxOyAvLyAtMSA9IGluZlxyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmRvbmVQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5yZXZlcnNlID0gZmFsc2U7XHJcbiAgICAgICAgLy8gc21vb3RoaW5nXHJcbiAgICAgICAgdGhpcy51c2VTbW9vdGhpbmcgPSB0cnVlO1xyXG4gICAgICAgIC8vIGZpbHRlcmluZ1xyXG4gICAgICAgIHRoaXMuZmlsdGVyVHlwZSA9IDA7XHJcbiAgICAgICAgdGhpcy5maWx0ZXJGcmFjdGlvbiA9IDE7XHJcbiAgICAgICAgLy8gZWNob1xyXG4gICAgICAgIHRoaXMudXNlRWNobyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZWNob0ZlZWRiYWNrID0gMC43NTtcclxuICAgICAgICB0aGlzLmVjaG9CdWZmZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy5lY2hvVm9sdW1lID0gMDtcclxuICAgICAgICB0aGlzLmVjaG9EZWxheSA9IDA7XHJcbiAgICAgICAgLy8gdm9sdW1lXHJcbiAgICAgICAgdGhpcy52b2x1bWVCb3RoID0gMTtcclxuICAgICAgICB0aGlzLnZvbHVtZUxlZnQgPSAxO1xyXG4gICAgICAgIHRoaXMudm9sdW1lUmlnaHQgPSAxO1xyXG4gICAgICAgIHRoaXMudm9sdW1lTGVmdFNtb290aCA9IDA7XHJcbiAgICAgICAgdGhpcy52b2x1bWVSaWdodFNtb290aCA9IDA7XHJcbiAgICAgICAgLy8gbGZvXHJcbiAgICAgICAgdGhpcy5sZm9Wb2x1bWVUaW1lID0gMTtcclxuICAgICAgICB0aGlzLmxmb1ZvbHVtZUFtb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5sZm9QaXRjaFRpbWUgPSAxO1xyXG4gICAgICAgIHRoaXMubGZvUGl0Y2hBbW91bnQgPSAwO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gYnVmZmVyO1xyXG4gICAgICAgIHRoaXMuYXVkaW8gPSBhdWRpbztcclxuICAgICAgICB0aGlzLnNwZWVkU21vb3RoID0gdGhpcy5zcGVlZDtcclxuICAgICAgICB0aGlzLnVybCA9IHVybDtcclxuICAgIH1cclxuICAgIHBsYXkoKSB7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IDA7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIHN0b3AocG9zaXRpb24pIHtcclxuICAgICAgICBpZiAocG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHVzZUZGVChfKSB7XHJcbiAgICAgICAgLy8gbGF0ZXJcclxuICAgIH1cclxuICAgIHNldFVzZUVjaG8oZW5hYmxlKSB7XHJcbiAgICAgICAgdGhpcy51c2VFY2hvID0gZW5hYmxlO1xyXG4gICAgICAgIGlmIChlbmFibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRFY2hvRGVsYXkodGhpcy5lY2hvRGVsYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5lY2hvQnVmZmVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHNldEVjaG9EZWxheShkZWxheSkge1xyXG4gICAgICAgIGlmICh0aGlzLnVzZUVjaG8gJiYgKCF0aGlzLmVjaG9CdWZmZXIgfHwgZGVsYXkgIT0gdGhpcy5lY2hvQnVmZmVyLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgbGV0IHNpemUgPSAxO1xyXG4gICAgICAgICAgICB3aGlsZSAoKHNpemUgPDw9IDEpIDwgZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA7XHJcbiAgICAgICAgICAgIHRoaXMuZWNob0J1ZmZlciA9IHRoaXMuYXVkaW8uY3JlYXRlQnVmZmVyKDIsIHNpemUsIHRoaXMuYXVkaW8uc2FtcGxlUmF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZWNob0RlbGF5ID0gZGVsYXk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gU3RyZWFtO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBTdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TdHJlYW1cIikpO1xyXG5jbGFzcyBTdHJlYW1GYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBkb3dubG9hZEJ1ZmZlcihhdWRpbywgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlckNhY2hlLmdldCh1cmwpO1xyXG4gICAgICAgIGlmICghc2tpcENhY2hlICYmIGJ1ZmZlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gYnVmZmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwpO1xyXG4gICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcclxuICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XHJcbiAgICAgICAgICAgIHJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXVkaW8uZGVjb2RlQXVkaW9EYXRhKHJlcXVlc3QucmVzcG9uc2UsIChidWZmZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckNhY2hlLnNldCh1cmwsIGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgfSwgKGVycikgPT4gcmVqZWN0KGVycikpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgY3JlYXRlU3RyZWFtKGF1ZGlvLCB1cmwsIHNraXBDYWNoZSkge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuZG93bmxvYWRCdWZmZXIoYXVkaW8sIHVybCwgc2tpcENhY2hlKTtcclxuICAgICAgICByZXR1cm4gbmV3IFN0cmVhbV8xLmRlZmF1bHQoYnVmZmVyLCBhdWRpbywgdXJsKTtcclxuICAgIH1cclxuICAgIGRlc3Ryb3lTdHJlYW0oc3RyZWFtKSB7XHJcbiAgICAgICAgaWYgKHN0cmVhbSkge1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckNhY2hlLmRlbGV0ZShzdHJlYW0udXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gU3RyZWFtRmFjdG9yeTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgU3RyZWFtRmFjdG9yeV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1N0cmVhbUZhY3RvcnlcIikpO1xyXG5jb25zdCBCVUZGRVJfU0laRSA9IDEwMjQ7XHJcbmNsYXNzIFdlYkF1ZGlvIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuc3RyZWFtcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZmFjdG9yeSA9IG5ldyBTdHJlYW1GYWN0b3J5XzEuZGVmYXVsdCgpO1xyXG4gICAgICAgIHRoaXMuc3RyZWFtTG9va3VwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMuYXVkaW8gPSBuZXcgQXVkaW9Db250ZXh0KCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IgPSB0aGlzLmF1ZGlvLmNyZWF0ZVNjcmlwdFByb2Nlc3NvcihCVUZGRVJfU0laRSwgMiwgMik7XHJcbiAgICAgICAgdGhpcy5nYWluID0gdGhpcy5hdWRpby5jcmVhdGVHYWluKCk7XHJcbiAgICAgICAgdGhpcy5jb21wcmVzc29yID0gdGhpcy5hdWRpby5jcmVhdGVEeW5hbWljc0NvbXByZXNzb3IoKTtcclxuICAgICAgICB0aGlzLnByb2Nlc3Nvci5vbmF1ZGlvcHJvY2VzcyA9IChldikgPT4gdGhpcy5vbkF1ZGlvUHJvY2Vzcyhldik7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3IuY29ubmVjdCh0aGlzLmNvbXByZXNzb3IpO1xyXG4gICAgICAgIHRoaXMuY29tcHJlc3Nvci5jb25uZWN0KHRoaXMuZ2Fpbik7XHJcbiAgICAgICAgdGhpcy5nYWluLmNvbm5lY3QodGhpcy5hdWRpby5kZXN0aW5hdGlvbik7XHJcbiAgICB9XHJcbiAgICBvbkF1ZGlvUHJvY2VzcyhldmVudCkge1xyXG4gICAgICAgIGxldCBvdXRwdXRMZWZ0ID0gZXZlbnQub3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG4gICAgICAgIGxldCBvdXRwdXRSaWdodCA9IGV2ZW50Lm91dHB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50Lm91dHB1dEJ1ZmZlci5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBvdXRwdXRMZWZ0W2ldID0gMDtcclxuICAgICAgICAgICAgb3V0cHV0UmlnaHRbaV0gPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc3RyZWFtcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLnN0cmVhbXNbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlckxlbiA9IHN0cmVhbS5idWZmZXIubGVuZ3RoO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJMZWZ0ID0gc3RyZWFtLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyUmlnaHQgPSBzdHJlYW0uYnVmZmVyLm51bWJlck9mQ2hhbm5lbHMgPT09IDFcclxuICAgICAgICAgICAgICAgID8gYnVmZmVyTGVmdFxyXG4gICAgICAgICAgICAgICAgOiBzdHJlYW0uYnVmZmVyLmdldENoYW5uZWxEYXRhKDEpO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLnVzZVNtb290aGluZykge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNwZWVkU21vb3RoID1cclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uc3BlZWRTbW9vdGggKyAoc3RyZWFtLnNwZWVkIC0gc3RyZWFtLnNwZWVkU21vb3RoKSAqIDE7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lTGVmdFNtb290aCA9XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGggK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RyZWFtLnZvbHVtZUxlZnQgLSBzdHJlYW0udm9sdW1lTGVmdFNtb290aCkgKiAxO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoID1cclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGggK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RyZWFtLnZvbHVtZVJpZ2h0IC0gc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoKSAqIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uc3BlZWRTbW9vdGggPSBzdHJlYW0uc3BlZWQ7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lTGVmdFNtb290aCA9IHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoID0gc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghc3RyZWFtLnVzZUVjaG8gJiYgKHN0cmVhbS5wYXVzZWQgfHwgKHN0cmVhbS52b2x1bWVMZWZ0IDwgMC4wMDEgJiYgc3RyZWFtLnZvbHVtZVJpZ2h0IDwgMC4wMDEpKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGVjaG9sID0gW107XHJcbiAgICAgICAgICAgIGxldCBlY2hvciA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLnVzZUVjaG8gJiYgc3RyZWFtLmVjaG9CdWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIGVjaG9sID0gc3RyZWFtLmVjaG9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XHJcbiAgICAgICAgICAgICAgICBlY2hvciA9IHN0cmVhbS5lY2hvQnVmZmVyLmdldENoYW5uZWxEYXRhKDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBzbWwgPSAwO1xyXG4gICAgICAgICAgICBsZXQgc21yID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBldmVudC5vdXRwdXRCdWZmZXIubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ucGF1c2VkIHx8IChzdHJlYW0ubWF4TG9vcCA+IDAgJiYgc3RyZWFtLnBvc2l0aW9uID4gYnVmZmVyTGVuICogc3RyZWFtLm1heExvb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmRvbmVQbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS5wYXVzZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RyZWFtLnVzZUVjaG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmRvbmVQbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSAoc3RyZWFtLnBvc2l0aW9uID4+IDApICUgYnVmZmVyTGVuO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5yZXZlcnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSAtaW5kZXggKyBidWZmZXJMZW47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgbGVmdCA9IDA7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmlnaHQgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0uZG9uZVBsYXlpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5maWx0ZXJUeXBlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vbmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGJ1ZmZlckxlZnRbaW5kZXhdICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gYnVmZmVyUmlnaHRbaW5kZXhdICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbWwgPSBzbWwgKyAoYnVmZmVyTGVmdFtpbmRleF0gLSBzbWwpICogc3RyZWFtLmZpbHRlckZyYWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbXIgPSBzbXIgKyAoYnVmZmVyUmlnaHRbaW5kZXhdIC0gc21yKSAqIHN0cmVhbS5maWx0ZXJGcmFjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5maWx0ZXJUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMb3cgcGFzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IHNtbCAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBzbXIgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChzdHJlYW0uZmlsdGVyVHlwZSA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGlnaCBwYXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gKGJ1ZmZlckxlZnRbaW5kZXhdIC0gc21sKSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSAoYnVmZmVyUmlnaHRbaW5kZXhdIC0gc21yKSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSBNYXRoLm1pbihNYXRoLm1heChsZWZ0LCAtMSksIDEpICogc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBNYXRoLm1pbihNYXRoLm1heChyaWdodCwgLTEpLCAxKSAqIHN0cmVhbS52b2x1bWVSaWdodFNtb290aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubGZvVm9sdW1lVGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IE1hdGguc2luKChzdHJlYW0ucG9zaXRpb24gLyB0aGlzLmF1ZGlvLnNhbXBsZVJhdGUpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgMTAgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubGZvVm9sdW1lVGltZSkgKiBzdHJlYW0ubGZvVm9sdW1lQW1vdW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgKj0gcmVzO1xyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0ICo9IHJlcztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0udXNlRWNobykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVjaG9JbmRleCA9IChzdHJlYW0ucG9zaXRpb24gPj4gMCkgJSBzdHJlYW0uZWNob0RlbGF5O1xyXG4gICAgICAgICAgICAgICAgICAgIGVjaG9sW2VjaG9JbmRleF0gKj0gc3RyZWFtLmVjaG9GZWVkYmFjayArIGxlZnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZWNob3JbZWNob0luZGV4XSAqPSBzdHJlYW0uZWNob0ZlZWRiYWNrICsgcmlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0TGVmdFtqXSArPSBlY2hvbFtlY2hvSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdICs9IGVjaG9yW2VjaG9JbmRleF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRMZWZ0W2pdICs9IGxlZnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0UmlnaHRbal0gKz0gcmlnaHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgc3BlZWQgPSBzdHJlYW0uc3BlZWRTbW9vdGg7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmxmb1BpdGNoVGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNwZWVkIC09XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc2luKChzdHJlYW0ucG9zaXRpb24gLyB0aGlzLmF1ZGlvLnNhbXBsZVJhdGUpICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEwICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5sZm9QaXRjaFRpbWUpICogc3RyZWFtLmxmb1BpdGNoQW1vdW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHNwZWVkICs9IE1hdGgucG93KHN0cmVhbS5sZm9QaXRjaEFtb3VudCAqIDAuNSwgMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ucG9zaXRpb24gKz0gc3BlZWQ7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtYXggPSAxO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0TGVmdFtqXSA9IE1hdGgubWluKE1hdGgubWF4KG91dHB1dExlZnRbal0sIC1tYXgpLCBtYXgpO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0UmlnaHRbal0gPSBNYXRoLm1pbihNYXRoLm1heChvdXRwdXRSaWdodFtqXSwgLW1heCksIG1heCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmluaXRlKG91dHB1dExlZnRbal0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0TGVmdFtqXSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmluaXRlKG91dHB1dFJpZ2h0W2pdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuYXVkaW8uZGVzdGluYXRpb24uZGlzY29ubmVjdCgpO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgY3JlYXRlU3RyZWFtKGlkLCB1cmwsIHNraXBDYWNoZSkge1xyXG4gICAgICAgIGlmIChza2lwQ2FjaGUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgc2tpcENhY2hlID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgdGhpcy5mYWN0b3J5LmNyZWF0ZVN0cmVhbSh0aGlzLmF1ZGlvLCB1cmwsIHNraXBDYWNoZSk7XHJcbiAgICAgICAgdGhpcy5zdHJlYW1Mb29rdXAuc2V0KGlkLCBzdHJlYW0pO1xyXG4gICAgICAgIHRoaXMuc3RyZWFtcy5wdXNoKHN0cmVhbSk7XHJcbiAgICAgICAgcmV0dXJuIHN0cmVhbTtcclxuICAgIH1cclxuICAgIGRlc3Ryb3lTdHJlYW0oaWQpIHtcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLnN0cmVhbUxvb2t1cC5nZXQoaWQpO1xyXG4gICAgICAgIGlmICghc3RyZWFtKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zdHJlYW1Mb29rdXAuZGVsZXRlKGlkKTtcclxuICAgICAgICB0aGlzLmZhY3RvcnkuZGVzdHJveVN0cmVhbShzdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zdHJlYW1zLmluZGV4T2Yoc3RyZWFtKTtcclxuICAgICAgICB0aGlzLnN0cmVhbXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJBdWRpbztcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==