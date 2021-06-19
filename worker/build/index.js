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
function handler(query) {
    const parser = new ChatsoundsParser_1.default(query.lookup);
    const chatsounds = parser.parse(query.input);
    for (const cs of chatsounds) {
        console.log(cs);
    }
    return chatsounds.map(cs => cs.name);
}
exports.default = handler;


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
            if (precedingChunk.match(/\)\s*/)) {
                const index = precedingChunk.lastIndexOf("(");
                const subChunk = input.substr(index, match.index);
                //recursive logic here...
            }
            else {
                const ctx = new ChatsoundModifier_1.ChatsoundContextModifier(precedingChunk, modifier ? [modifier] : []);
                ret = ret.concat(this.parseContext(ctx));
                start = (match.index ? match.index : 0) + (match.length - 1);
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL0NoYXRzb3VuZC50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRzUGFyc2VyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9FY2hvTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1BpdGNoTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlYWxtTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlcGVhdE1vZGlmaWVyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9TZWxlY3RNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9tb2RpZmllcnMvVm9sdW1lTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtRmFjdG9yeS50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3dlYmF1ZGlvL1dlYkF1ZGlvLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQSw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0QsMkNBQTJDLG1CQUFPLENBQUMsbUVBQTJCO0FBQzlFLG1DQUFtQyxtQkFBTyxDQUFDLHVEQUFxQjtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTs7Ozs7Ozs7Ozs7QUNyQkY7QUFDYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlOzs7Ozs7Ozs7OztBQ1RGO0FBQ2IsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQzs7Ozs7Ozs7Ozs7QUNsQm5CO0FBQ2I7QUFDQTtBQUNBLGtDQUFrQyxvQ0FBb0MsYUFBYSxFQUFFLEVBQUU7QUFDdkYsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSx5Q0FBeUMsNkJBQTZCO0FBQ3RFLENBQUM7QUFDRDtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELG9DQUFvQyxtQkFBTyxDQUFDLDhDQUFhO0FBQ3pELDRCQUE0QixtQkFBTyxDQUFDLDhEQUFxQjtBQUN6RCwr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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwrQkFBK0I7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTs7Ozs7OztVQ3BLZjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kc1BhcnNlcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3BhcnNlci9DaGF0c291bmRzUGFyc2VyXCIpKTtcclxuY29uc3QgV2ViQXVkaW9fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi93ZWJhdWRpby9XZWJBdWRpb1wiKSk7XHJcbmFzeW5jIGZ1bmN0aW9uIGV4YW1wbGVTdHJlYW0oKSB7XHJcbiAgICBjb25zdCB3ZWJBdWRpbyA9IG5ldyBXZWJBdWRpb18xLmRlZmF1bHQoKTtcclxuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHdlYkF1ZGlvLmNyZWF0ZVN0cmVhbShcImlkZW50aWZpZXJcIiwgXCJodHRwczovL2dvb2dsZS5jb21cIik7XHJcbiAgICBzdHJlYW0ucGxheSgpO1xyXG4gICAgd2ViQXVkaW8uY2xvc2UoKTtcclxufVxyXG5mdW5jdGlvbiBoYW5kbGVyKHF1ZXJ5KSB7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgQ2hhdHNvdW5kc1BhcnNlcl8xLmRlZmF1bHQocXVlcnkubG9va3VwKTtcclxuICAgIGNvbnN0IGNoYXRzb3VuZHMgPSBwYXJzZXIucGFyc2UocXVlcnkuaW5wdXQpO1xyXG4gICAgZm9yIChjb25zdCBjcyBvZiBjaGF0c291bmRzKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coY3MpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoYXRzb3VuZHMubWFwKGNzID0+IGNzLm5hbWUpO1xyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGhhbmRsZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIENoYXRzb3VuZCB7XHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCB1cmwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIHRoaXMubW9kaWZpZXJzID0gW107XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhdHNvdW5kO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkNoYXRzb3VuZENvbnRleHRNb2RpZmllciA9IHZvaWQgMDtcclxuY2xhc3MgQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNvbnRlbnQsIG1vZGlmaWVycykge1xyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllcnMgPSBtb2RpZmllcnM7XHJcbiAgICB9XHJcbiAgICBnZXRBbGxNb2RpZmllcnMoKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGxldCBjdHggPSB0aGlzO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgcmV0ID0gcmV0LmNvbmNhdChjdHgubW9kaWZpZXJzKTtcclxuICAgICAgICAgICAgY3R4ID0gY3R4LnBhcmVudENvbnRleHQ7XHJcbiAgICAgICAgfSB3aGlsZSAoY3R4KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyID0gQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pKTtcclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19zZXRNb2R1bGVEZWZhdWx0KSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59KTtcclxudmFyIF9faW1wb3J0U3RhciA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnRTdGFyKSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vQ2hhdHNvdW5kXCIpKTtcclxuY29uc3QgQ2hhdHNvdW5kTW9kaWZpZXJfMSA9IHJlcXVpcmUoXCIuL0NoYXRzb3VuZE1vZGlmaWVyXCIpO1xyXG5jb25zdCBtb2RpZmllcnMgPSBfX2ltcG9ydFN0YXIocmVxdWlyZShcIi4vbW9kaWZpZXJzXCIpKTtcclxuLypcclxuICAgIENVUlJFTlQgSU1QTDpcclxuICAgICAgICAxKSBQYXJzZSBjb250ZXh1YWwgbW9kaWZpZXJzIGUuZyAoYXdkYXdkKTplY2hvKDAsIDEpXHJcbiAgICAgICAgMikgUGFyc2UgY2hhdHNvdW5kIGluIHRoZSBjb250ZXh0IG9mIHRoZSBtb2RpZmllclxyXG4gICAgICAgIDMpIEFwcGx5IHRoZSBjb250ZXh0IG1vZGlmaWVycyB0byBlYWNoIGNoYXRzb3VuZFxyXG4gICAgICAgIDQpIFJlcGVhdCAxKSAyKSAzKSB1bnRpbCB0aGVyZXMgbm90aGluZyBsZWZ0IHRvIHBhcnNlXHJcbiAgICAgICAgNSkgcmV0dXJuIHRoZSBsaXN0IG9mIHBhcnNlZCBjaGF0c291bmRzIHdpdGggbW9kaWZpZXJzIGFwcGxpZWQgdG8gdGhlbVxyXG5cclxuICAgIFBST0JMRU1TOlxyXG4gICAgICAgIC0gTGVnYWN5IG1vZGlmaWVycyBhcmUgY2hhdHNvdW5kLWF3YXJlIGJ1dCBub3QgY29udGV4dC1hd2FyZSwgbWVhbmluZyB0aGV5IGFsd2F5cyB1c2UgdGhlIGxhc3QgY2hhdHNvdW5kIHBhcnNlZFxyXG4gICAgICAgIC0gQ29udGV4dHVhbCBtb2RpZmllcnMgY2FuIGJlIHVzZWQgaW4gYSBsZWdhY3kgZmFzaGlvbjogYXdkYXdkOmVjaG9cclxuICAgICAgICAtIEFyZ3VtZW50cyBmb3IgY29udGV4dHVhbCBtb2RpZmllcnMgYWxzbyBjb250YWluIHBhcmVudGhlc2lzIGFuZCBjYW4gaGF2ZSBzcGFjZXNcclxuICAgICAgICAtIEx1YSBleHByZXNzaW9ucyBpbiBjb250ZXh0dWFsIG1vZGlmaWVyc1xyXG5cclxuICAgIFBPU1NJQkxFIFNPTFVUSU9OOlxyXG4gICAgICAgIEhhdmUgYSBsaXN0IG9mIG1vZGlmaWVycyB3aXRoIHRoZWlyIG5hbWVzLCBidWlsZCBhIGdsb2JhbCByZWdleCBvdXQgb2YgdGhlIG5hbWVzIGFuZCBwYXR0ZXJucyBmb3IgdGhlc2UgbW9kaWZpZXJzXHJcbiAgICAgICAgRm9yIGVhY2ggbWF0Y2ggd2UgcGFyc2UgdGhlIHN0cmluZyBmb3IgY2hhdHNvdW5kIGJlZm9yZSB0aGUgbW9kaWZpZXJzIHdvcmQgcGVyIHdvcmRcclxuICAgICAgICBJZiB0aGUgdGhlIGZpcnN0IGNoYXJhY3RlciBiZWZvcmUgdGhlIG1vZGlmaWVyIGlzIFwiKVwiIHdlIGFwcGx5IHRoZSBtb2RpZmllciB0byBlYWNoIGNoYXRzb3VuZCBwYXJzZWQgdXAgdW50aWwgd2UgZmluZCBcIihcIlxyXG4gICAgICAgIElmIHRoZXJlIGlzIG5vIFwiKVwiIHRoZW4gYXBwbHkgdGhlIG1vZGlmaWVyIG9ubHkgdG8gdGhlIGxhc3QgY2hhdHNvdW5kIHBhcnNlZFxyXG4gICAgICAgIFJldHVybiB0aGUgbGlzdCBvZiBwYXJzZWQgY2hhdHNvdW5kcyBhbG9uZyB3aXRoIHRoZWlyIG1vZGlmaWVyc1xyXG5cclxuICAgID0+IFRPRE9cclxuICAgIC0+IEltcGxlbWVudCBsb29rdXAgdGFibGUgZm9yIHNvdW5kcyAvIHVybHNcclxuICAgIC0+IEltcGxlbWVudCBtb2RpZmllcnNcclxuXHJcbiovXHJcbmNsYXNzIENoYXRzb3VuZHNQYXJzZXIge1xyXG4gICAgY29uc3RydWN0b3IobG9va3VwKSB7XHJcbiAgICAgICAgdGhpcy5sb29rdXAgPSBsb29rdXA7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllckxvb2t1cCA9IG5ldyBNYXAoKTtcclxuICAgICAgICB0aGlzLnBhdHRlcm4gPSAvLi87XHJcbiAgICAgICAgY29uc3QgbW9kaWZpZXJDbGFzc2VzID0gT2JqZWN0LmVudHJpZXMobW9kaWZpZXJzKTtcclxuICAgICAgICB0aGlzLmJ1aWxkTW9kaWZpZXJMb29rdXAobW9kaWZpZXJDbGFzc2VzKTtcclxuICAgICAgICB0aGlzLmJ1aWxkTW9kaWZpZXJQYXR0ZXJucyhtb2RpZmllckNsYXNzZXMpO1xyXG4gICAgfVxyXG4gICAgYnVpbGRNb2RpZmllckxvb2t1cChtb2RpZmllckNsYXNzZXMpIHtcclxuICAgICAgICBmb3IgKGNvbnN0IFtfLCBtb2RpZmllckNsYXNzXSBvZiBtb2RpZmllckNsYXNzZXMpIHtcclxuICAgICAgICAgICAgY29uc3QgbW9kaWZpZXIgPSBuZXcgbW9kaWZpZXJDbGFzcygpO1xyXG4gICAgICAgICAgICBpZiAobW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGlmaWVyTG9va3VwLnNldChtb2RpZmllci5sZWdhY3lDaGFyYWN0ZXIsIG1vZGlmaWVyQ2xhc3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtb2RpZmllci5uYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kaWZpZXJMb29rdXAuc2V0KGA6JHttb2RpZmllci5uYW1lfShgLCBtb2RpZmllckNsYXNzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGJ1aWxkTW9kaWZpZXJQYXR0ZXJucyhtb2RpZmllckNsYXNzZXMpIHtcclxuICAgICAgICBjb25zdCBpbnN0YW5jZXMgPSBtb2RpZmllckNsYXNzZXMubWFwKHggPT4gbmV3IHhbMV0oKSk7XHJcbiAgICAgICAgY29uc3QgbW9kZXJuUGF0dGVybiA9IFwiXFxcXHdcXFxcKT86KFwiICsgaW5zdGFuY2VzXHJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kaWZpZXIgPT4gbW9kaWZpZXIubmFtZS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAubWFwKG1vZGlmaWVyID0+IG1vZGlmaWVyLm5hbWUpXHJcbiAgICAgICAgICAgIC5qb2luKFwifFwiKSArIFwiKShcXFxcKChbMC05XXxcXFxcLnxcXFxcc3wsfC0pKlxcXFwpKT8oOj9cXFxcd3xcXFxcYilcIjtcclxuICAgICAgICBjb25zdCBsZWdhY3lQYXR0ZXJuID0gXCJcIiArIGluc3RhbmNlc1xyXG4gICAgICAgICAgICAuZmlsdGVyKG1vZGlmaWVyID0+IG1vZGlmaWVyLmxlZ2FjeUNoYXJhY3RlcilcclxuICAgICAgICAgICAgLm1hcChtb2RpZmllciA9PiBtb2RpZmllci5lc2NhcGVMZWdhY3kgPyBcIlxcXFxcIiArIG1vZGlmaWVyLmxlZ2FjeUNoYXJhY3RlciA6IG1vZGlmaWVyLmxlZ2FjeUNoYXJhY3RlcilcclxuICAgICAgICAgICAgLmpvaW4oXCJ8XCIpICsgXCIoWzAtOV0rKT8oOj9cXFxcd3xcXFxcYilcIjtcclxuICAgICAgICB0aGlzLnBhdHRlcm4gPSBuZXcgUmVnRXhwKGAoOj8ke21vZGVyblBhdHRlcm59KXwoOj8ke2xlZ2FjeVBhdHRlcm59KWAsIFwiZ2l1XCIpO1xyXG4gICAgfVxyXG4gICAgdHJ5R2V0TW9kaWZpZXIocmVnZXhSZXN1bHQpIHtcclxuICAgICAgICBpZiAoIXJlZ2V4UmVzdWx0Lmdyb3VwcylcclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBlbnRpcmVNYXRjaCA9IHJlZ2V4UmVzdWx0Lmdyb3Vwc1swXTtcclxuICAgICAgICBjb25zdCBtb2RpZmllck5hbWUgPSByZWdleFJlc3VsdC5ncm91cHNbMl07XHJcbiAgICAgICAgaWYgKGVudGlyZU1hdGNoLmluY2x1ZGVzKFwiOlwiKSAmJiB0aGlzLm1vZGlmaWVyTG9va3VwLmhhcyhtb2RpZmllck5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vZGlmaWVyTG9va3VwLmdldChtb2RpZmllck5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RpZmllckxvb2t1cC5nZXQoZW50aXJlTWF0Y2gpO1xyXG4gICAgfVxyXG4gICAgcGFyc2UoaW5wdXQpIHtcclxuICAgICAgICBsZXQgcmV0ID0gW107XHJcbiAgICAgICAgbGV0IGhhZE1hdGNoZXMgPSBmYWxzZTtcclxuICAgICAgICBsZXQgc3RhcnQgPSAwO1xyXG4gICAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgaW5wdXQubWF0Y2hBbGwodGhpcy5wYXR0ZXJuKSkge1xyXG4gICAgICAgICAgICBoYWRNYXRjaGVzID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc3QgbW9kaWZpZXIgPSB0aGlzLnRyeUdldE1vZGlmaWVyKG1hdGNoKTtcclxuICAgICAgICAgICAgY29uc3QgcHJlY2VkaW5nQ2h1bmsgPSBpbnB1dC5zdWJzdHJpbmcoc3RhcnQsIG1hdGNoLmluZGV4KTtcclxuICAgICAgICAgICAgaWYgKHByZWNlZGluZ0NodW5rLm1hdGNoKC9cXClcXHMqLykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gcHJlY2VkaW5nQ2h1bmsubGFzdEluZGV4T2YoXCIoXCIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3ViQ2h1bmsgPSBpbnB1dC5zdWJzdHIoaW5kZXgsIG1hdGNoLmluZGV4KTtcclxuICAgICAgICAgICAgICAgIC8vcmVjdXJzaXZlIGxvZ2ljIGhlcmUuLi5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN0eCA9IG5ldyBDaGF0c291bmRNb2RpZmllcl8xLkNoYXRzb3VuZENvbnRleHRNb2RpZmllcihwcmVjZWRpbmdDaHVuaywgbW9kaWZpZXIgPyBbbW9kaWZpZXJdIDogW10pO1xyXG4gICAgICAgICAgICAgICAgcmV0ID0gcmV0LmNvbmNhdCh0aGlzLnBhcnNlQ29udGV4dChjdHgpKTtcclxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gKG1hdGNoLmluZGV4ID8gbWF0Y2guaW5kZXggOiAwKSArIChtYXRjaC5sZW5ndGggLSAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWhhZE1hdGNoZXMpIHtcclxuICAgICAgICAgICAgcmV0ID0gdGhpcy5wYXJzZUNvbnRleHQobmV3IENoYXRzb3VuZE1vZGlmaWVyXzEuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyKGlucHV0LCBbXSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgcGFyc2VDb250ZXh0KGN0eCkge1xyXG4gICAgICAgIGNvbnN0IHJldCA9IFtdO1xyXG4gICAgICAgIGNvbnN0IG1vZGlmaWVycyA9IGN0eC5nZXRBbGxNb2RpZmllcnMoKTtcclxuICAgICAgICBsZXQgd29yZHMgPSBjdHguY29udGVudC5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgbGV0IGVuZCA9IHdvcmRzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAod29yZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBjaHVuayA9IHdvcmRzLnNsaWNlKDAsIGVuZCkuam9pbihcIiBcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGNoYXRzb3VuZFVybCA9IHRoaXMubG9va3VwLmdldChjaHVuayk7XHJcbiAgICAgICAgICAgIGlmIChjaGF0c291bmRVcmwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoYXRzb3VuZCA9IG5ldyBDaGF0c291bmRfMS5kZWZhdWx0KGNodW5rLCBjaGF0c291bmRVcmwpO1xyXG4gICAgICAgICAgICAgICAgY2hhdHNvdW5kLm1vZGlmaWVycyA9IGNoYXRzb3VuZC5tb2RpZmllcnMuY29uY2F0KG1vZGlmaWVycyk7IC8vIGFkZCB0aGUgY29udGV4dCBtb2RpZmllcnNcclxuICAgICAgICAgICAgICAgIHJldC5wdXNoKGNoYXRzb3VuZCk7XHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHBhcnNlZCBjaGF0c291bmQgYW5kIHJlc2V0IG91ciBwcm9jZXNzaW5nIHZhcnNcclxuICAgICAgICAgICAgICAgIC8vIHNvIGl0J3Mgbm90IHBhcnNlZCB0d2ljZVxyXG4gICAgICAgICAgICAgICAgd29yZHMgPSB3b3Jkcy5zbGljZShlbmQsIHdvcmRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBlbmQgPSB3b3Jkcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbmQtLTtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoYXQgaGFwcGVucyB3ZSBtYXRjaGVkIG5vdGhpbmcgZnJvbSB3aGVyZSB3ZSBzdGFydGVkXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBzdGFydCBmcm9tIHRoZSBuZXh0IHdvcmRcclxuICAgICAgICAgICAgICAgIGlmIChlbmQgPD0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdvcmRzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gd29yZHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhdHNvdW5kc1BhcnNlcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgRWNob01vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwiZWNob1wiO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IEVjaG9Nb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgUGl0Y2hNb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcInBpdGNoXCI7XHJcbiAgICAgICAgdGhpcy5sZWdhY3lDaGFyYWN0ZXIgPSBcIiVcIjtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBQaXRjaE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBSZWFsbU1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwicmVhbG1cIjtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBSZWFsbU1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBSZXBlYXRNb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcInJlcFwiO1xyXG4gICAgICAgIHRoaXMubGVnYWN5Q2hhcmFjdGVyID0gXCIqXCI7XHJcbiAgICAgICAgdGhpcy5lc2NhcGVMZWdhY3kgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFJlcGVhdE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBTZWxlY3RNb2RpZmllciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMubGVnYWN5Q2hhcmFjdGVyID0gXCIjXCI7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gU2VsZWN0TW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFZvbHVtZU1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwidm9sdW1lXCI7XHJcbiAgICAgICAgdGhpcy5sZWdhY3lDaGFyYWN0ZXIgPSBcIl5cIjtcclxuICAgICAgICB0aGlzLmVzY2FwZUxlZ2FjeSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gVm9sdW1lTW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuVm9sdW1lTW9kaWZpZXIgPSBleHBvcnRzLlNlbGVjdE1vZGlmaWVyID0gZXhwb3J0cy5SZXBlYXRNb2RpZmllciA9IGV4cG9ydHMuUmVhbG1Nb2RpZmllciA9IGV4cG9ydHMuUGl0Y2hNb2RpZmllciA9IGV4cG9ydHMuRWNob01vZGlmaWVyID0gdm9pZCAwO1xyXG5jb25zdCBFY2hvTW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9FY2hvTW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLkVjaG9Nb2RpZmllciA9IEVjaG9Nb2RpZmllcl8xLmRlZmF1bHQ7XHJcbmNvbnN0IFBpdGNoTW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9QaXRjaE1vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5QaXRjaE1vZGlmaWVyID0gUGl0Y2hNb2RpZmllcl8xLmRlZmF1bHQ7XHJcbmNvbnN0IFJlYWxtTW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9SZWFsbU1vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5SZWFsbU1vZGlmaWVyID0gUmVhbG1Nb2RpZmllcl8xLmRlZmF1bHQ7XHJcbmNvbnN0IFJlcGVhdE1vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vUmVwZWF0TW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLlJlcGVhdE1vZGlmaWVyID0gUmVwZWF0TW9kaWZpZXJfMS5kZWZhdWx0O1xyXG5jb25zdCBTZWxlY3RNb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1NlbGVjdE1vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5TZWxlY3RNb2RpZmllciA9IFNlbGVjdE1vZGlmaWVyXzEuZGVmYXVsdDtcclxuY29uc3QgVm9sdW1lTW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9Wb2x1bWVNb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuVm9sdW1lTW9kaWZpZXIgPSBWb2x1bWVNb2RpZmllcl8xLmRlZmF1bHQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFN0cmVhbSB7XHJcbiAgICBjb25zdHJ1Y3RvcihidWZmZXIsIGF1ZGlvLCB1cmwpIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gMDtcclxuICAgICAgICB0aGlzLnNwZWVkID0gMTsgLy8gMSA9IG5vcm1hbCBwaXRjaFxyXG4gICAgICAgIHRoaXMubWF4TG9vcCA9IDE7IC8vIC0xID0gaW5mXHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZG9uZVBsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnJldmVyc2UgPSBmYWxzZTtcclxuICAgICAgICAvLyBzbW9vdGhpbmdcclxuICAgICAgICB0aGlzLnVzZVNtb290aGluZyA9IHRydWU7XHJcbiAgICAgICAgLy8gZmlsdGVyaW5nXHJcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gMDtcclxuICAgICAgICB0aGlzLmZpbHRlckZyYWN0aW9uID0gMTtcclxuICAgICAgICAvLyBlY2hvXHJcbiAgICAgICAgdGhpcy51c2VFY2hvID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5lY2hvRmVlZGJhY2sgPSAwLjc1O1xyXG4gICAgICAgIHRoaXMuZWNob0J1ZmZlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLmVjaG9Wb2x1bWUgPSAwO1xyXG4gICAgICAgIHRoaXMuZWNob0RlbGF5ID0gMDtcclxuICAgICAgICAvLyB2b2x1bWVcclxuICAgICAgICB0aGlzLnZvbHVtZUJvdGggPSAxO1xyXG4gICAgICAgIHRoaXMudm9sdW1lTGVmdCA9IDE7XHJcbiAgICAgICAgdGhpcy52b2x1bWVSaWdodCA9IDE7XHJcbiAgICAgICAgdGhpcy52b2x1bWVMZWZ0U21vb3RoID0gMDtcclxuICAgICAgICB0aGlzLnZvbHVtZVJpZ2h0U21vb3RoID0gMDtcclxuICAgICAgICAvLyBsZm9cclxuICAgICAgICB0aGlzLmxmb1ZvbHVtZVRpbWUgPSAxO1xyXG4gICAgICAgIHRoaXMubGZvVm9sdW1lQW1vdW50ID0gMDtcclxuICAgICAgICB0aGlzLmxmb1BpdGNoVGltZSA9IDE7XHJcbiAgICAgICAgdGhpcy5sZm9QaXRjaEFtb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSBidWZmZXI7XHJcbiAgICAgICAgdGhpcy5hdWRpbyA9IGF1ZGlvO1xyXG4gICAgICAgIHRoaXMuc3BlZWRTbW9vdGggPSB0aGlzLnNwZWVkO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgfVxyXG4gICAgcGxheSgpIHtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gMDtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgc3RvcChwb3NpdGlvbikge1xyXG4gICAgICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgdXNlRkZUKF8pIHtcclxuICAgICAgICAvLyBsYXRlclxyXG4gICAgfVxyXG4gICAgc2V0VXNlRWNobyhlbmFibGUpIHtcclxuICAgICAgICB0aGlzLnVzZUVjaG8gPSBlbmFibGU7XHJcbiAgICAgICAgaWYgKGVuYWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEVjaG9EZWxheSh0aGlzLmVjaG9EZWxheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmVjaG9CdWZmZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc2V0RWNob0RlbGF5KGRlbGF5KSB7XHJcbiAgICAgICAgaWYgKHRoaXMudXNlRWNobyAmJiAoIXRoaXMuZWNob0J1ZmZlciB8fCBkZWxheSAhPSB0aGlzLmVjaG9CdWZmZXIubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICBsZXQgc2l6ZSA9IDE7XHJcbiAgICAgICAgICAgIHdoaWxlICgoc2l6ZSA8PD0gMSkgPCBkZWxheSlcclxuICAgICAgICAgICAgICAgIDtcclxuICAgICAgICAgICAgdGhpcy5lY2hvQnVmZmVyID0gdGhpcy5hdWRpby5jcmVhdGVCdWZmZXIoMiwgc2l6ZSwgdGhpcy5hdWRpby5zYW1wbGVSYXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lY2hvRGVsYXkgPSBkZWxheTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBTdHJlYW07XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IFN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1N0cmVhbVwiKSk7XHJcbmNsYXNzIFN0cmVhbUZhY3Rvcnkge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJDYWNoZSA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuICAgIGFzeW5jIGRvd25sb2FkQnVmZmVyKGF1ZGlvLCB1cmwsIHNraXBDYWNoZSkge1xyXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyQ2FjaGUuZ2V0KHVybCk7XHJcbiAgICAgICAgaWYgKCFza2lwQ2FjaGUgJiYgYnVmZmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCk7XHJcbiAgICAgICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xyXG4gICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhdWRpby5kZWNvZGVBdWRpb0RhdGEocmVxdWVzdC5yZXNwb25zZSwgKGJ1ZmZlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUuc2V0KHVybCwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB9LCAoZXJyKSA9PiByZWplY3QoZXJyKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjcmVhdGVTdHJlYW0oYXVkaW8sIHVybCwgc2tpcENhY2hlKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgdGhpcy5kb3dubG9hZEJ1ZmZlcihhdWRpbywgdXJsLCBza2lwQ2FjaGUpO1xyXG4gICAgICAgIHJldHVybiBuZXcgU3RyZWFtXzEuZGVmYXVsdChidWZmZXIsIGF1ZGlvLCB1cmwpO1xyXG4gICAgfVxyXG4gICAgZGVzdHJveVN0cmVhbShzdHJlYW0pIHtcclxuICAgICAgICBpZiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUuZGVsZXRlKHN0cmVhbS51cmwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBTdHJlYW1GYWN0b3J5O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBTdHJlYW1GYWN0b3J5XzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vU3RyZWFtRmFjdG9yeVwiKSk7XHJcbmNvbnN0IEJVRkZFUl9TSVpFID0gMTAyNDtcclxuY2xhc3MgV2ViQXVkaW8ge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5zdHJlYW1zID0gW107XHJcbiAgICAgICAgdGhpcy5mYWN0b3J5ID0gbmV3IFN0cmVhbUZhY3RvcnlfMS5kZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5zdHJlYW1Mb29rdXAgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgdGhpcy5hdWRpbyA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NvciA9IHRoaXMuYXVkaW8uY3JlYXRlU2NyaXB0UHJvY2Vzc29yKEJVRkZFUl9TSVpFLCAyLCAyKTtcclxuICAgICAgICB0aGlzLmdhaW4gPSB0aGlzLmF1ZGlvLmNyZWF0ZUdhaW4oKTtcclxuICAgICAgICB0aGlzLmNvbXByZXNzb3IgPSB0aGlzLmF1ZGlvLmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLm9uYXVkaW9wcm9jZXNzID0gKGV2KSA9PiB0aGlzLm9uQXVkaW9Qcm9jZXNzKGV2KTtcclxuICAgICAgICB0aGlzLnByb2Nlc3Nvci5jb25uZWN0KHRoaXMuY29tcHJlc3Nvcik7XHJcbiAgICAgICAgdGhpcy5jb21wcmVzc29yLmNvbm5lY3QodGhpcy5nYWluKTtcclxuICAgICAgICB0aGlzLmdhaW4uY29ubmVjdCh0aGlzLmF1ZGlvLmRlc3RpbmF0aW9uKTtcclxuICAgIH1cclxuICAgIG9uQXVkaW9Qcm9jZXNzKGV2ZW50KSB7XHJcbiAgICAgICAgbGV0IG91dHB1dExlZnQgPSBldmVudC5vdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XHJcbiAgICAgICAgbGV0IG91dHB1dFJpZ2h0ID0gZXZlbnQub3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDEpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnQub3V0cHV0QnVmZmVyLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIG91dHB1dExlZnRbaV0gPSAwO1xyXG4gICAgICAgICAgICBvdXRwdXRSaWdodFtpXSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdHJlYW1zLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuc3RyZWFtc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyTGVuID0gc3RyZWFtLmJ1ZmZlci5sZW5ndGg7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlckxlZnQgPSBzdHJlYW0uYnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJSaWdodCA9IHN0cmVhbS5idWZmZXIubnVtYmVyT2ZDaGFubmVscyA9PT0gMVxyXG4gICAgICAgICAgICAgICAgPyBidWZmZXJMZWZ0XHJcbiAgICAgICAgICAgICAgICA6IHN0cmVhbS5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSk7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0udXNlU21vb3RoaW5nKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uc3BlZWRTbW9vdGggPVxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5zcGVlZFNtb290aCArIChzdHJlYW0uc3BlZWQgLSBzdHJlYW0uc3BlZWRTbW9vdGgpICogMTtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoID1cclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lTGVmdFNtb290aCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdHJlYW0udm9sdW1lTGVmdCAtIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoKSAqIDE7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGggPVxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdHJlYW0udm9sdW1lUmlnaHQgLSBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGgpICogMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5zcGVlZFNtb290aCA9IHN0cmVhbS5zcGVlZDtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoID0gc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGg7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGggPSBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFzdHJlYW0udXNlRWNobyAmJiAoc3RyZWFtLnBhdXNlZCB8fCAoc3RyZWFtLnZvbHVtZUxlZnQgPCAwLjAwMSAmJiBzdHJlYW0udm9sdW1lUmlnaHQgPCAwLjAwMSkpKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgZWNob2wgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGVjaG9yID0gW107XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0udXNlRWNobyAmJiBzdHJlYW0uZWNob0J1ZmZlcikge1xyXG4gICAgICAgICAgICAgICAgZWNob2wgPSBzdHJlYW0uZWNob0J1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICAgICAgICAgIGVjaG9yID0gc3RyZWFtLmVjaG9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IHNtbCA9IDA7XHJcbiAgICAgICAgICAgIGxldCBzbXIgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGV2ZW50Lm91dHB1dEJ1ZmZlci5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5wYXVzZWQgfHwgKHN0cmVhbS5tYXhMb29wID4gMCAmJiBzdHJlYW0ucG9zaXRpb24gPiBidWZmZXJMZW4gKiBzdHJlYW0ubWF4TG9vcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZG9uZVBsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RyZWFtLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0udXNlRWNobykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZG9uZVBsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IChzdHJlYW0ucG9zaXRpb24gPj4gMCkgJSBidWZmZXJMZW47XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnJldmVyc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IC1pbmRleCArIGJ1ZmZlckxlbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBsZWZ0ID0gMDtcclxuICAgICAgICAgICAgICAgIGxldCByaWdodCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS5kb25lUGxheWluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlcnNcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmZpbHRlclR5cGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9uZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gYnVmZmVyTGVmdFtpbmRleF0gKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSBidWZmZXJSaWdodFtpbmRleF0gKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNtbCA9IHNtbCArIChidWZmZXJMZWZ0W2luZGV4XSAtIHNtbCkgKiBzdHJlYW0uZmlsdGVyRnJhY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNtciA9IHNtciArIChidWZmZXJSaWdodFtpbmRleF0gLSBzbXIpICogc3RyZWFtLmZpbHRlckZyYWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmZpbHRlclR5cGUgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExvdyBwYXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gc21sICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IHNtciAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0cmVhbS5maWx0ZXJUeXBlID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIaWdoIHBhc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSAoYnVmZmVyTGVmdFtpbmRleF0gLSBzbWwpICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IChidWZmZXJSaWdodFtpbmRleF0gLSBzbXIpICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdCA9IE1hdGgubWluKE1hdGgubWF4KGxlZnQsIC0xKSwgMSkgKiBzdHJlYW0udm9sdW1lTGVmdFNtb290aDtcclxuICAgICAgICAgICAgICAgICAgICByaWdodCA9IE1hdGgubWluKE1hdGgubWF4KHJpZ2h0LCAtMSksIDEpICogc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5sZm9Wb2x1bWVUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gTWF0aC5zaW4oKHN0cmVhbS5wb3NpdGlvbiAvIHRoaXMuYXVkaW8uc2FtcGxlUmF0ZSkgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAxMCAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5sZm9Wb2x1bWVUaW1lKSAqIHN0cmVhbS5sZm9Wb2x1bWVBbW91bnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdCAqPSByZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQgKj0gcmVzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS51c2VFY2hvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWNob0luZGV4ID0gKHN0cmVhbS5wb3NpdGlvbiA+PiAwKSAlIHN0cmVhbS5lY2hvRGVsYXk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWNob2xbZWNob0luZGV4XSAqPSBzdHJlYW0uZWNob0ZlZWRiYWNrICsgbGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBlY2hvcltlY2hvSW5kZXhdICo9IHN0cmVhbS5lY2hvRmVlZGJhY2sgKyByaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRMZWZ0W2pdICs9IGVjaG9sW2VjaG9JbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0UmlnaHRbal0gKz0gZWNob3JbZWNob0luZGV4XTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gKz0gbGVmdDtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSArPSByaWdodDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBzcGVlZCA9IHN0cmVhbS5zcGVlZFNtb290aDtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubGZvUGl0Y2hUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3BlZWQgLT1cclxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5zaW4oKHN0cmVhbS5wb3NpdGlvbiAvIHRoaXMuYXVkaW8uc2FtcGxlUmF0ZSkgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMTAgKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmxmb1BpdGNoVGltZSkgKiBzdHJlYW0ubGZvUGl0Y2hBbW91bnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgc3BlZWQgKz0gTWF0aC5wb3coc3RyZWFtLmxmb1BpdGNoQW1vdW50ICogMC41LCAyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0cmVhbS5wb3NpdGlvbiArPSBzcGVlZDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1heCA9IDE7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRMZWZ0W2pdID0gTWF0aC5taW4oTWF0aC5tYXgob3V0cHV0TGVmdFtqXSwgLW1heCksIG1heCk7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSA9IE1hdGgubWluKE1hdGgubWF4KG91dHB1dFJpZ2h0W2pdLCAtbWF4KSwgbWF4KTtcclxuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUob3V0cHV0TGVmdFtqXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRMZWZ0W2pdID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUob3V0cHV0UmlnaHRbal0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0UmlnaHRbal0gPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY2xvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5hdWRpby5kZXN0aW5hdGlvbi5kaXNjb25uZWN0KCk7XHJcbiAgICB9XHJcbiAgICBhc3luYyBjcmVhdGVTdHJlYW0oaWQsIHVybCwgc2tpcENhY2hlKSB7XHJcbiAgICAgICAgaWYgKHNraXBDYWNoZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBza2lwQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCB0aGlzLmZhY3RvcnkuY3JlYXRlU3RyZWFtKHRoaXMuYXVkaW8sIHVybCwgc2tpcENhY2hlKTtcclxuICAgICAgICB0aGlzLnN0cmVhbUxvb2t1cC5zZXQoaWQsIHN0cmVhbSk7XHJcbiAgICAgICAgdGhpcy5zdHJlYW1zLnB1c2goc3RyZWFtKTtcclxuICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgfVxyXG4gICAgZGVzdHJveVN0cmVhbShpZCkge1xyXG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuc3RyZWFtTG9va3VwLmdldChpZCk7XHJcbiAgICAgICAgaWYgKCFzdHJlYW0pXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB0aGlzLnN0cmVhbUxvb2t1cC5kZWxldGUoaWQpO1xyXG4gICAgICAgIHRoaXMuZmFjdG9yeS5kZXN0cm95U3RyZWFtKHN0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnN0cmVhbXMuaW5kZXhPZihzdHJlYW0pO1xyXG4gICAgICAgIHRoaXMuc3RyZWFtcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFdlYkF1ZGlvO1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXgudHNcIik7XG4iXSwic291cmNlUm9vdCI6IiJ9