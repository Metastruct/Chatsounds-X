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
function referenceArrayToLookup(refs) {
    // TODO
    // impl array to lookup map for chatsounds
    return new Map();
}
window.HANDLE = (queryString) => {
    const query = JSON.parse(queryString);
    const parser = new ChatsoundsParser_1.default(referenceArrayToLookup(query.refs));
    const chatsounds = parser.parse(query.input);
    // return chatsounds for test purposes
    // eventually we will return an audio stream
    return chatsounds.map(cs => cs.name);
};


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL0NoYXRzb3VuZC50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRzUGFyc2VyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9FY2hvTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1BpdGNoTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlYWxtTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL1JlcGVhdE1vZGlmaWVyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9TZWxlY3RNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9tb2RpZmllcnMvVm9sdW1lTW9kaWZpZXIudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy9wYXJzZXIvbW9kaWZpZXJzL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvd2ViYXVkaW8vU3RyZWFtRmFjdG9yeS50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3dlYmF1ZGlvL1dlYkF1ZGlvLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFhO0FBQ2I7QUFDQSw0Q0FBNEM7QUFDNUM7QUFDQSw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0QsMkNBQTJDLG1CQUFPLENBQUMsbUVBQTJCO0FBQzlFLG1DQUFtQyxtQkFBTyxDQUFDLHVEQUFxQjtBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUN6QmE7QUFDYiw4Q0FBNkMsQ0FBQyxjQUFjLEVBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlOzs7Ozs7Ozs7OztBQ1RGO0FBQ2IsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQzs7Ozs7Ozs7Ozs7QUNsQm5CO0FBQ2I7QUFDQTtBQUNBLGtDQUFrQyxvQ0FBb0MsYUFBYSxFQUFFLEVBQUU7QUFDdkYsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSx5Q0FBeUMsNkJBQTZCO0FBQ3RFLENBQUM7QUFDRDtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELG9DQUFvQyxtQkFBTyxDQUFDLDhDQUFhO0FBQ3pELDRCQUE0QixtQkFBTyxDQUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQiwrQkFBK0I7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZTs7Ozs7OztVQ3BLZjtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kc1BhcnNlcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3BhcnNlci9DaGF0c291bmRzUGFyc2VyXCIpKTtcclxuY29uc3QgV2ViQXVkaW9fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi93ZWJhdWRpby9XZWJBdWRpb1wiKSk7XHJcbmFzeW5jIGZ1bmN0aW9uIGV4YW1wbGVTdHJlYW0oKSB7XHJcbiAgICBjb25zdCB3ZWJBdWRpbyA9IG5ldyBXZWJBdWRpb18xLmRlZmF1bHQoKTtcclxuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHdlYkF1ZGlvLmNyZWF0ZVN0cmVhbShcImlkZW50aWZpZXJcIiwgXCJodHRwczovL2dvb2dsZS5jb21cIik7XHJcbiAgICBzdHJlYW0ucGxheSgpO1xyXG4gICAgd2ViQXVkaW8uY2xvc2UoKTtcclxufVxyXG5mdW5jdGlvbiByZWZlcmVuY2VBcnJheVRvTG9va3VwKHJlZnMpIHtcclxuICAgIC8vIFRPRE9cclxuICAgIC8vIGltcGwgYXJyYXkgdG8gbG9va3VwIG1hcCBmb3IgY2hhdHNvdW5kc1xyXG4gICAgcmV0dXJuIG5ldyBNYXAoKTtcclxufVxyXG53aW5kb3cuSEFORExFID0gKHF1ZXJ5U3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCBxdWVyeSA9IEpTT04ucGFyc2UocXVlcnlTdHJpbmcpO1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IENoYXRzb3VuZHNQYXJzZXJfMS5kZWZhdWx0KHJlZmVyZW5jZUFycmF5VG9Mb29rdXAocXVlcnkucmVmcykpO1xyXG4gICAgY29uc3QgY2hhdHNvdW5kcyA9IHBhcnNlci5wYXJzZShxdWVyeS5pbnB1dCk7XHJcbiAgICAvLyByZXR1cm4gY2hhdHNvdW5kcyBmb3IgdGVzdCBwdXJwb3Nlc1xyXG4gICAgLy8gZXZlbnR1YWxseSB3ZSB3aWxsIHJldHVybiBhbiBhdWRpbyBzdHJlYW1cclxuICAgIHJldHVybiBjaGF0c291bmRzLm1hcChjcyA9PiBjcy5uYW1lKTtcclxufTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgQ2hhdHNvdW5kIHtcclxuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHVybCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllcnMgPSBbXTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBDaGF0c291bmQ7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyID0gdm9pZCAwO1xyXG5jbGFzcyBDaGF0c291bmRDb250ZXh0TW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoY29udGVudCwgbW9kaWZpZXJzKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gY29udGVudDtcclxuICAgICAgICB0aGlzLm1vZGlmaWVycyA9IG1vZGlmaWVycztcclxuICAgIH1cclxuICAgIGdldEFsbE1vZGlmaWVycygpIHtcclxuICAgICAgICBsZXQgcmV0ID0gW107XHJcbiAgICAgICAgbGV0IGN0eCA9IHRoaXM7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICByZXQgPSByZXQuY29uY2F0KGN0eC5tb2RpZmllcnMpO1xyXG4gICAgICAgICAgICBjdHggPSBjdHgucGFyZW50Q29udGV4dDtcclxuICAgICAgICB9IHdoaWxlIChjdHgpO1xyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5DaGF0c291bmRDb250ZXh0TW9kaWZpZXIgPSBDaGF0c291bmRDb250ZXh0TW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19jcmVhdGVCaW5kaW5nID0gKHRoaXMgJiYgdGhpcy5fX2NyZWF0ZUJpbmRpbmcpIHx8IChPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSkpO1xyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX3NldE1vZHVsZURlZmF1bHQpIHx8IChPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBcImRlZmF1bHRcIiwgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdiB9KTtcclxufSkgOiBmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBvW1wiZGVmYXVsdFwiXSA9IHY7XHJcbn0pO1xyXG52YXIgX19pbXBvcnRTdGFyID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydFN0YXIpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBDaGF0c291bmRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9DaGF0c291bmRcIikpO1xyXG5jb25zdCBDaGF0c291bmRNb2RpZmllcl8xID0gcmVxdWlyZShcIi4vQ2hhdHNvdW5kTW9kaWZpZXJcIik7XHJcbmNvbnN0IG1vZGlmaWVycyA9IF9faW1wb3J0U3RhcihyZXF1aXJlKFwiLi9tb2RpZmllcnNcIikpO1xyXG4vKlxyXG4gICAgQ1VSUkVOVCBJTVBMOlxyXG4gICAgICAgIDEpIFBhcnNlIGNvbnRleHVhbCBtb2RpZmllcnMgZS5nIChhd2Rhd2QpOmVjaG8oMCwgMSlcclxuICAgICAgICAyKSBQYXJzZSBjaGF0c291bmQgaW4gdGhlIGNvbnRleHQgb2YgdGhlIG1vZGlmaWVyXHJcbiAgICAgICAgMykgQXBwbHkgdGhlIGNvbnRleHQgbW9kaWZpZXJzIHRvIGVhY2ggY2hhdHNvdW5kXHJcbiAgICAgICAgNCkgUmVwZWF0IDEpIDIpIDMpIHVudGlsIHRoZXJlcyBub3RoaW5nIGxlZnQgdG8gcGFyc2VcclxuICAgICAgICA1KSByZXR1cm4gdGhlIGxpc3Qgb2YgcGFyc2VkIGNoYXRzb3VuZHMgd2l0aCBtb2RpZmllcnMgYXBwbGllZCB0byB0aGVtXHJcblxyXG4gICAgUFJPQkxFTVM6XHJcbiAgICAgICAgLSBMZWdhY3kgbW9kaWZpZXJzIGFyZSBjaGF0c291bmQtYXdhcmUgYnV0IG5vdCBjb250ZXh0LWF3YXJlLCBtZWFuaW5nIHRoZXkgYWx3YXlzIHVzZSB0aGUgbGFzdCBjaGF0c291bmQgcGFyc2VkXHJcbiAgICAgICAgLSBDb250ZXh0dWFsIG1vZGlmaWVycyBjYW4gYmUgdXNlZCBpbiBhIGxlZ2FjeSBmYXNoaW9uOiBhd2Rhd2Q6ZWNob1xyXG4gICAgICAgIC0gQXJndW1lbnRzIGZvciBjb250ZXh0dWFsIG1vZGlmaWVycyBhbHNvIGNvbnRhaW4gcGFyZW50aGVzaXMgYW5kIGNhbiBoYXZlIHNwYWNlc1xyXG4gICAgICAgIC0gTHVhIGV4cHJlc3Npb25zIGluIGNvbnRleHR1YWwgbW9kaWZpZXJzXHJcblxyXG4gICAgUE9TU0lCTEUgU09MVVRJT046XHJcbiAgICAgICAgSGF2ZSBhIGxpc3Qgb2YgbW9kaWZpZXJzIHdpdGggdGhlaXIgbmFtZXMsIGJ1aWxkIGEgZ2xvYmFsIHJlZ2V4IG91dCBvZiB0aGUgbmFtZXMgYW5kIHBhdHRlcm5zIGZvciB0aGVzZSBtb2RpZmllcnNcclxuICAgICAgICBGb3IgZWFjaCBtYXRjaCB3ZSBwYXJzZSB0aGUgc3RyaW5nIGZvciBjaGF0c291bmQgYmVmb3JlIHRoZSBtb2RpZmllcnMgd29yZCBwZXIgd29yZFxyXG4gICAgICAgIElmIHRoZSB0aGUgZmlyc3QgY2hhcmFjdGVyIGJlZm9yZSB0aGUgbW9kaWZpZXIgaXMgXCIpXCIgd2UgYXBwbHkgdGhlIG1vZGlmaWVyIHRvIGVhY2ggY2hhdHNvdW5kIHBhcnNlZCB1cCB1bnRpbCB3ZSBmaW5kIFwiKFwiXHJcbiAgICAgICAgSWYgdGhlcmUgaXMgbm8gXCIpXCIgdGhlbiBhcHBseSB0aGUgbW9kaWZpZXIgb25seSB0byB0aGUgbGFzdCBjaGF0c291bmQgcGFyc2VkXHJcbiAgICAgICAgUmV0dXJuIHRoZSBsaXN0IG9mIHBhcnNlZCBjaGF0c291bmRzIGFsb25nIHdpdGggdGhlaXIgbW9kaWZpZXJzXHJcblxyXG4gICAgPT4gVE9ET1xyXG4gICAgLT4gSW1wbGVtZW50IGxvb2t1cCB0YWJsZSBmb3Igc291bmRzIC8gdXJsc1xyXG4gICAgLT4gSW1wbGVtZW50IG1vZGlmaWVyc1xyXG5cclxuKi9cclxuY2xhc3MgQ2hhdHNvdW5kc1BhcnNlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihsb29rdXApIHtcclxuICAgICAgICB0aGlzLmxvb2t1cCA9IGxvb2t1cDtcclxuICAgICAgICB0aGlzLm1vZGlmaWVyTG9va3VwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMucGF0dGVybiA9IC8uLztcclxuICAgICAgICBjb25zdCBtb2RpZmllckNsYXNzZXMgPSBPYmplY3QuZW50cmllcyhtb2RpZmllcnMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGRNb2RpZmllckxvb2t1cChtb2RpZmllckNsYXNzZXMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGRNb2RpZmllclBhdHRlcm5zKG1vZGlmaWVyQ2xhc3Nlcyk7XHJcbiAgICB9XHJcbiAgICBidWlsZE1vZGlmaWVyTG9va3VwKG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgIGZvciAoY29uc3QgW18sIG1vZGlmaWVyQ2xhc3NdIG9mIG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgICAgICBjb25zdCBtb2RpZmllciA9IG5ldyBtb2RpZmllckNsYXNzKCk7XHJcbiAgICAgICAgICAgIGlmIChtb2RpZmllci5sZWdhY3lDaGFyYWN0ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kaWZpZXJMb29rdXAuc2V0KG1vZGlmaWVyLmxlZ2FjeUNoYXJhY3RlciwgbW9kaWZpZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG1vZGlmaWVyLm5hbWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RpZmllckxvb2t1cC5zZXQoYDoke21vZGlmaWVyLm5hbWV9KGAsIG1vZGlmaWVyQ2xhc3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgYnVpbGRNb2RpZmllclBhdHRlcm5zKG1vZGlmaWVyQ2xhc3Nlcykge1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlcyA9IG1vZGlmaWVyQ2xhc3Nlcy5tYXAoeCA9PiBuZXcgeFsxXSgpKTtcclxuICAgICAgICBjb25zdCBtb2Rlcm5QYXR0ZXJuID0gXCJcXFxcd1xcXFwpPzooXCIgKyBpbnN0YW5jZXNcclxuICAgICAgICAgICAgLmZpbHRlcihtb2RpZmllciA9PiBtb2RpZmllci5uYW1lLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIC5tYXAobW9kaWZpZXIgPT4gbW9kaWZpZXIubmFtZSlcclxuICAgICAgICAgICAgLmpvaW4oXCJ8XCIpICsgXCIpKFxcXFwoKFswLTldfFxcXFwufFxcXFxzfCx8LSkqXFxcXCkpPyg6P1xcXFx3fFxcXFxiKVwiO1xyXG4gICAgICAgIGNvbnN0IGxlZ2FjeVBhdHRlcm4gPSBcIlwiICsgaW5zdGFuY2VzXHJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kaWZpZXIgPT4gbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICAubWFwKG1vZGlmaWVyID0+IG1vZGlmaWVyLmVzY2FwZUxlZ2FjeSA/IFwiXFxcXFwiICsgbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyIDogbW9kaWZpZXIubGVnYWN5Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICAuam9pbihcInxcIikgKyBcIihbMC05XSspPyg6P1xcXFx3fFxcXFxiKVwiO1xyXG4gICAgICAgIHRoaXMucGF0dGVybiA9IG5ldyBSZWdFeHAoYCg6PyR7bW9kZXJuUGF0dGVybn0pfCg6PyR7bGVnYWN5UGF0dGVybn0pYCwgXCJnaXVcIik7XHJcbiAgICB9XHJcbiAgICB0cnlHZXRNb2RpZmllcihyZWdleFJlc3VsdCkge1xyXG4gICAgICAgIGlmICghcmVnZXhSZXN1bHQuZ3JvdXBzKVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IGVudGlyZU1hdGNoID0gcmVnZXhSZXN1bHQuZ3JvdXBzWzBdO1xyXG4gICAgICAgIGNvbnN0IG1vZGlmaWVyTmFtZSA9IHJlZ2V4UmVzdWx0Lmdyb3Vwc1syXTtcclxuICAgICAgICBpZiAoZW50aXJlTWF0Y2guaW5jbHVkZXMoXCI6XCIpICYmIHRoaXMubW9kaWZpZXJMb29rdXAuaGFzKG1vZGlmaWVyTmFtZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubW9kaWZpZXJMb29rdXAuZ2V0KG1vZGlmaWVyTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGlmaWVyTG9va3VwLmdldChlbnRpcmVNYXRjaCk7XHJcbiAgICB9XHJcbiAgICBwYXJzZShpbnB1dCkge1xyXG4gICAgICAgIGxldCByZXQgPSBbXTtcclxuICAgICAgICBsZXQgaGFkTWF0Y2hlcyA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBzdGFydCA9IDA7XHJcbiAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBpbnB1dC5tYXRjaEFsbCh0aGlzLnBhdHRlcm4pKSB7XHJcbiAgICAgICAgICAgIGhhZE1hdGNoZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCBtb2RpZmllciA9IHRoaXMudHJ5R2V0TW9kaWZpZXIobWF0Y2gpO1xyXG4gICAgICAgICAgICBjb25zdCBwcmVjZWRpbmdDaHVuayA9IGlucHV0LnN1YnN0cmluZyhzdGFydCwgbWF0Y2guaW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAocHJlY2VkaW5nQ2h1bmsubWF0Y2goL1xcKVxccyovKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBwcmVjZWRpbmdDaHVuay5sYXN0SW5kZXhPZihcIihcIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJDaHVuayA9IGlucHV0LnN1YnN0cihpbmRleCwgbWF0Y2guaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgLy9yZWN1cnNpdmUgbG9naWMgaGVyZS4uLlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gbmV3IENoYXRzb3VuZE1vZGlmaWVyXzEuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyKHByZWNlZGluZ0NodW5rLCBtb2RpZmllciA/IFttb2RpZmllcl0gOiBbXSk7XHJcbiAgICAgICAgICAgICAgICByZXQgPSByZXQuY29uY2F0KHRoaXMucGFyc2VDb250ZXh0KGN0eCkpO1xyXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAobWF0Y2guaW5kZXggPyBtYXRjaC5pbmRleCA6IDApICsgKG1hdGNoLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghaGFkTWF0Y2hlcykge1xyXG4gICAgICAgICAgICByZXQgPSB0aGlzLnBhcnNlQ29udGV4dChuZXcgQ2hhdHNvdW5kTW9kaWZpZXJfMS5DaGF0c291bmRDb250ZXh0TW9kaWZpZXIoaW5wdXQsIFtdKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBwYXJzZUNvbnRleHQoY3R4KSB7XHJcbiAgICAgICAgY29uc3QgcmV0ID0gW107XHJcbiAgICAgICAgY29uc3QgbW9kaWZpZXJzID0gY3R4LmdldEFsbE1vZGlmaWVycygpO1xyXG4gICAgICAgIGxldCB3b3JkcyA9IGN0eC5jb250ZW50LnNwbGl0KFwiIFwiKTtcclxuICAgICAgICBsZXQgZW5kID0gd29yZHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlICh3b3Jkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gd29yZHMuc2xpY2UoMCwgZW5kKS5qb2luKFwiIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgY2hhdHNvdW5kVXJsID0gdGhpcy5sb29rdXAuZ2V0KGNodW5rKTtcclxuICAgICAgICAgICAgaWYgKGNoYXRzb3VuZFVybCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hhdHNvdW5kID0gbmV3IENoYXRzb3VuZF8xLmRlZmF1bHQoY2h1bmssIGNoYXRzb3VuZFVybCk7XHJcbiAgICAgICAgICAgICAgICBjaGF0c291bmQubW9kaWZpZXJzID0gY2hhdHNvdW5kLm1vZGlmaWVycy5jb25jYXQobW9kaWZpZXJzKTsgLy8gYWRkIHRoZSBjb250ZXh0IG1vZGlmaWVyc1xyXG4gICAgICAgICAgICAgICAgcmV0LnB1c2goY2hhdHNvdW5kKTtcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgcGFyc2VkIGNoYXRzb3VuZCBhbmQgcmVzZXQgb3VyIHByb2Nlc3NpbmcgdmFyc1xyXG4gICAgICAgICAgICAgICAgLy8gc28gaXQncyBub3QgcGFyc2VkIHR3aWNlXHJcbiAgICAgICAgICAgICAgICB3b3JkcyA9IHdvcmRzLnNsaWNlKGVuZCwgd29yZHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGVuZCA9IHdvcmRzLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVuZC0tO1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhhdCBoYXBwZW5zIHdlIG1hdGNoZWQgbm90aGluZyBmcm9tIHdoZXJlIHdlIHN0YXJ0ZWRcclxuICAgICAgICAgICAgICAgIC8vIHNvIHN0YXJ0IGZyb20gdGhlIG5leHQgd29yZFxyXG4gICAgICAgICAgICAgICAgaWYgKGVuZCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd29yZHMuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBlbmQgPSB3b3Jkcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBDaGF0c291bmRzUGFyc2VyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBFY2hvTW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJlY2hvXCI7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gRWNob01vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jbGFzcyBQaXRjaE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwicGl0Y2hcIjtcclxuICAgICAgICB0aGlzLmxlZ2FjeUNoYXJhY3RlciA9IFwiJVwiO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFBpdGNoTW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFJlYWxtTW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJyZWFsbVwiO1xyXG4gICAgfVxyXG4gICAgcHJvY2Vzcyhzb3VuZFN0cmluZykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFJlYWxtTW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFJlcGVhdE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwicmVwXCI7XHJcbiAgICAgICAgdGhpcy5sZWdhY3lDaGFyYWN0ZXIgPSBcIipcIjtcclxuICAgICAgICB0aGlzLmVzY2FwZUxlZ2FjeSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBwcm9jZXNzKHNvdW5kU3RyaW5nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gUmVwZWF0TW9kaWZpZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIFNlbGVjdE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5sZWdhY3lDaGFyYWN0ZXIgPSBcIiNcIjtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBTZWxlY3RNb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgVm9sdW1lTW9kaWZpZXIge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJ2b2x1bWVcIjtcclxuICAgICAgICB0aGlzLmxlZ2FjeUNoYXJhY3RlciA9IFwiXlwiO1xyXG4gICAgICAgIHRoaXMuZXNjYXBlTGVnYWN5ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHByb2Nlc3Moc291bmRTdHJpbmcpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBWb2x1bWVNb2RpZmllcjtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5Wb2x1bWVNb2RpZmllciA9IGV4cG9ydHMuU2VsZWN0TW9kaWZpZXIgPSBleHBvcnRzLlJlcGVhdE1vZGlmaWVyID0gZXhwb3J0cy5SZWFsbU1vZGlmaWVyID0gZXhwb3J0cy5QaXRjaE1vZGlmaWVyID0gZXhwb3J0cy5FY2hvTW9kaWZpZXIgPSB2b2lkIDA7XHJcbmNvbnN0IEVjaG9Nb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL0VjaG9Nb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuRWNob01vZGlmaWVyID0gRWNob01vZGlmaWVyXzEuZGVmYXVsdDtcclxuY29uc3QgUGl0Y2hNb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1BpdGNoTW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLlBpdGNoTW9kaWZpZXIgPSBQaXRjaE1vZGlmaWVyXzEuZGVmYXVsdDtcclxuY29uc3QgUmVhbG1Nb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1JlYWxtTW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLlJlYWxtTW9kaWZpZXIgPSBSZWFsbU1vZGlmaWVyXzEuZGVmYXVsdDtcclxuY29uc3QgUmVwZWF0TW9kaWZpZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9SZXBlYXRNb2RpZmllclwiKSk7XHJcbmV4cG9ydHMuUmVwZWF0TW9kaWZpZXIgPSBSZXBlYXRNb2RpZmllcl8xLmRlZmF1bHQ7XHJcbmNvbnN0IFNlbGVjdE1vZGlmaWVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vU2VsZWN0TW9kaWZpZXJcIikpO1xyXG5leHBvcnRzLlNlbGVjdE1vZGlmaWVyID0gU2VsZWN0TW9kaWZpZXJfMS5kZWZhdWx0O1xyXG5jb25zdCBWb2x1bWVNb2RpZmllcl8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL1ZvbHVtZU1vZGlmaWVyXCIpKTtcclxuZXhwb3J0cy5Wb2x1bWVNb2RpZmllciA9IFZvbHVtZU1vZGlmaWVyXzEuZGVmYXVsdDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgU3RyZWFtIHtcclxuICAgIGNvbnN0cnVjdG9yKGJ1ZmZlciwgYXVkaW8sIHVybCkge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSAwO1xyXG4gICAgICAgIHRoaXMuc3BlZWQgPSAxOyAvLyAxID0gbm9ybWFsIHBpdGNoXHJcbiAgICAgICAgdGhpcy5tYXhMb29wID0gMTsgLy8gLTEgPSBpbmZcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5kb25lUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMucmV2ZXJzZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vIHNtb290aGluZ1xyXG4gICAgICAgIHRoaXMudXNlU21vb3RoaW5nID0gdHJ1ZTtcclxuICAgICAgICAvLyBmaWx0ZXJpbmdcclxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSAwO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyRnJhY3Rpb24gPSAxO1xyXG4gICAgICAgIC8vIGVjaG9cclxuICAgICAgICB0aGlzLnVzZUVjaG8gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmVjaG9GZWVkYmFjayA9IDAuNzU7XHJcbiAgICAgICAgdGhpcy5lY2hvQnVmZmVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuZWNob1ZvbHVtZSA9IDA7XHJcbiAgICAgICAgdGhpcy5lY2hvRGVsYXkgPSAwO1xyXG4gICAgICAgIC8vIHZvbHVtZVxyXG4gICAgICAgIHRoaXMudm9sdW1lQm90aCA9IDE7XHJcbiAgICAgICAgdGhpcy52b2x1bWVMZWZ0ID0gMTtcclxuICAgICAgICB0aGlzLnZvbHVtZVJpZ2h0ID0gMTtcclxuICAgICAgICB0aGlzLnZvbHVtZUxlZnRTbW9vdGggPSAwO1xyXG4gICAgICAgIHRoaXMudm9sdW1lUmlnaHRTbW9vdGggPSAwO1xyXG4gICAgICAgIC8vIGxmb1xyXG4gICAgICAgIHRoaXMubGZvVm9sdW1lVGltZSA9IDE7XHJcbiAgICAgICAgdGhpcy5sZm9Wb2x1bWVBbW91bnQgPSAwO1xyXG4gICAgICAgIHRoaXMubGZvUGl0Y2hUaW1lID0gMTtcclxuICAgICAgICB0aGlzLmxmb1BpdGNoQW1vdW50ID0gMDtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcclxuICAgICAgICB0aGlzLmF1ZGlvID0gYXVkaW87XHJcbiAgICAgICAgdGhpcy5zcGVlZFNtb290aCA9IHRoaXMuc3BlZWQ7XHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICB9XHJcbiAgICBwbGF5KCkge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSAwO1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBzdG9wKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB1c2VGRlQoXykge1xyXG4gICAgICAgIC8vIGxhdGVyXHJcbiAgICB9XHJcbiAgICBzZXRVc2VFY2hvKGVuYWJsZSkge1xyXG4gICAgICAgIHRoaXMudXNlRWNobyA9IGVuYWJsZTtcclxuICAgICAgICBpZiAoZW5hYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RWNob0RlbGF5KHRoaXMuZWNob0RlbGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWNob0J1ZmZlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzZXRFY2hvRGVsYXkoZGVsYXkpIHtcclxuICAgICAgICBpZiAodGhpcy51c2VFY2hvICYmICghdGhpcy5lY2hvQnVmZmVyIHx8IGRlbGF5ICE9IHRoaXMuZWNob0J1ZmZlci5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIGxldCBzaXplID0gMTtcclxuICAgICAgICAgICAgd2hpbGUgKChzaXplIDw8PSAxKSA8IGRlbGF5KVxyXG4gICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICB0aGlzLmVjaG9CdWZmZXIgPSB0aGlzLmF1ZGlvLmNyZWF0ZUJ1ZmZlcigyLCBzaXplLCB0aGlzLmF1ZGlvLnNhbXBsZVJhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVjaG9EZWxheSA9IGRlbGF5O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgU3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vU3RyZWFtXCIpKTtcclxuY2xhc3MgU3RyZWFtRmFjdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlckNhY2hlID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG4gICAgYXN5bmMgZG93bmxvYWRCdWZmZXIoYXVkaW8sIHVybCwgc2tpcENhY2hlKSB7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXJDYWNoZS5nZXQodXJsKTtcclxuICAgICAgICBpZiAoIXNraXBDYWNoZSAmJiBidWZmZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsKTtcclxuICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcbiAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGF1ZGlvLmRlY29kZUF1ZGlvRGF0YShyZXF1ZXN0LnJlc3BvbnNlLCAoYnVmZmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5idWZmZXJDYWNoZS5zZXQodXJsLCBidWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHJlamVjdChlcnIpKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHJlcXVlc3QucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGFzeW5jIGNyZWF0ZVN0cmVhbShhdWRpbywgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICBjb25zdCBidWZmZXIgPSBhd2FpdCB0aGlzLmRvd25sb2FkQnVmZmVyKGF1ZGlvLCB1cmwsIHNraXBDYWNoZSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJlYW1fMS5kZWZhdWx0KGJ1ZmZlciwgYXVkaW8sIHVybCk7XHJcbiAgICB9XHJcbiAgICBkZXN0cm95U3RyZWFtKHN0cmVhbSkge1xyXG4gICAgICAgIGlmIChzdHJlYW0pIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJDYWNoZS5kZWxldGUoc3RyZWFtLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbUZhY3Rvcnk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IFN0cmVhbUZhY3RvcnlfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TdHJlYW1GYWN0b3J5XCIpKTtcclxuY29uc3QgQlVGRkVSX1NJWkUgPSAxMDI0O1xyXG5jbGFzcyBXZWJBdWRpbyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnN0cmVhbXMgPSBbXTtcclxuICAgICAgICB0aGlzLmZhY3RvcnkgPSBuZXcgU3RyZWFtRmFjdG9yeV8xLmRlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLnN0cmVhbUxvb2t1cCA9IG5ldyBNYXAoKTtcclxuICAgICAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yID0gdGhpcy5hdWRpby5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoQlVGRkVSX1NJWkUsIDIsIDIpO1xyXG4gICAgICAgIHRoaXMuZ2FpbiA9IHRoaXMuYXVkaW8uY3JlYXRlR2FpbigpO1xyXG4gICAgICAgIHRoaXMuY29tcHJlc3NvciA9IHRoaXMuYXVkaW8uY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3Iub25hdWRpb3Byb2Nlc3MgPSAoZXYpID0+IHRoaXMub25BdWRpb1Byb2Nlc3MoZXYpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLmNvbm5lY3QodGhpcy5jb21wcmVzc29yKTtcclxuICAgICAgICB0aGlzLmNvbXByZXNzb3IuY29ubmVjdCh0aGlzLmdhaW4pO1xyXG4gICAgICAgIHRoaXMuZ2Fpbi5jb25uZWN0KHRoaXMuYXVkaW8uZGVzdGluYXRpb24pO1xyXG4gICAgfVxyXG4gICAgb25BdWRpb1Byb2Nlc3MoZXZlbnQpIHtcclxuICAgICAgICBsZXQgb3V0cHV0TGVmdCA9IGV2ZW50Lm91dHB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICBsZXQgb3V0cHV0UmlnaHQgPSBldmVudC5vdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5vdXRwdXRCdWZmZXIubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgb3V0cHV0TGVmdFtpXSA9IDA7XHJcbiAgICAgICAgICAgIG91dHB1dFJpZ2h0W2ldID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN0cmVhbXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyZWFtID0gdGhpcy5zdHJlYW1zW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJMZW4gPSBzdHJlYW0uYnVmZmVyLmxlbmd0aDtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyTGVmdCA9IHN0cmVhbS5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclJpZ2h0ID0gc3RyZWFtLmJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzID09PSAxXHJcbiAgICAgICAgICAgICAgICA/IGJ1ZmZlckxlZnRcclxuICAgICAgICAgICAgICAgIDogc3RyZWFtLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS51c2VTbW9vdGhpbmcpIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5zcGVlZFNtb290aCA9XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnNwZWVkU21vb3RoICsgKHN0cmVhbS5zcGVlZCAtIHN0cmVhbS5zcGVlZFNtb290aCkgKiAxO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGggPVxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHN0cmVhbS52b2x1bWVMZWZ0IC0gc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGgpICogMTtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCA9XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHN0cmVhbS52b2x1bWVSaWdodCAtIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCkgKiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNwZWVkU21vb3RoID0gc3RyZWFtLnNwZWVkO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGggPSBzdHJlYW0udm9sdW1lTGVmdFNtb290aDtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCA9IHN0cmVhbS52b2x1bWVSaWdodFNtb290aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXN0cmVhbS51c2VFY2hvICYmIChzdHJlYW0ucGF1c2VkIHx8IChzdHJlYW0udm9sdW1lTGVmdCA8IDAuMDAxICYmIHN0cmVhbS52b2x1bWVSaWdodCA8IDAuMDAxKSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBlY2hvbCA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgZWNob3IgPSBbXTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS51c2VFY2hvICYmIHN0cmVhbS5lY2hvQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBlY2hvbCA9IHN0cmVhbS5lY2hvQnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG4gICAgICAgICAgICAgICAgZWNob3IgPSBzdHJlYW0uZWNob0J1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgc21sID0gMDtcclxuICAgICAgICAgICAgbGV0IHNtciA9IDA7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZXZlbnQub3V0cHV0QnVmZmVyLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnBhdXNlZCB8fCAoc3RyZWFtLm1heExvb3AgPiAwICYmIHN0cmVhbS5wb3NpdGlvbiA+IGJ1ZmZlckxlbiAqIHN0cmVhbS5tYXhMb29wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5kb25lUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0ucGF1c2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS51c2VFY2hvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5kb25lUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gKHN0cmVhbS5wb3NpdGlvbiA+PiAwKSAlIGJ1ZmZlckxlbjtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ucmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gLWluZGV4ICsgYnVmZmVyTGVuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIGlmICghc3RyZWFtLmRvbmVQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVyc1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZmlsdGVyVHlwZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb25lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBidWZmZXJMZWZ0W2luZGV4XSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IGJ1ZmZlclJpZ2h0W2luZGV4XSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc21sID0gc21sICsgKGJ1ZmZlckxlZnRbaW5kZXhdIC0gc21sKSAqIHN0cmVhbS5maWx0ZXJGcmFjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc21yID0gc21yICsgKGJ1ZmZlclJpZ2h0W2luZGV4XSAtIHNtcikgKiBzdHJlYW0uZmlsdGVyRnJhY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZmlsdGVyVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTG93IHBhc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBzbWwgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gc21yICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLmZpbHRlclR5cGUgPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhpZ2ggcGFzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IChidWZmZXJMZWZ0W2luZGV4XSAtIHNtbCkgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gKGJ1ZmZlclJpZ2h0W2luZGV4XSAtIHNtcikgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gTWF0aC5taW4oTWF0aC5tYXgobGVmdCwgLTEpLCAxKSAqIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gTWF0aC5taW4oTWF0aC5tYXgocmlnaHQsIC0xKSwgMSkgKiBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmxmb1ZvbHVtZVRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBNYXRoLnNpbigoc3RyZWFtLnBvc2l0aW9uIC8gdGhpcy5hdWRpby5zYW1wbGVSYXRlKSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDEwICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmxmb1ZvbHVtZVRpbWUpICogc3RyZWFtLmxmb1ZvbHVtZUFtb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0ICo9IHJlcztcclxuICAgICAgICAgICAgICAgICAgICByaWdodCAqPSByZXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnVzZUVjaG8pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlY2hvSW5kZXggPSAoc3RyZWFtLnBvc2l0aW9uID4+IDApICUgc3RyZWFtLmVjaG9EZWxheTtcclxuICAgICAgICAgICAgICAgICAgICBlY2hvbFtlY2hvSW5kZXhdICo9IHN0cmVhbS5lY2hvRmVlZGJhY2sgKyBsZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGVjaG9yW2VjaG9JbmRleF0gKj0gc3RyZWFtLmVjaG9GZWVkYmFjayArIHJpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gKz0gZWNob2xbZWNob0luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSArPSBlY2hvcltlY2hvSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0TGVmdFtqXSArPSBsZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdICs9IHJpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHNwZWVkID0gc3RyZWFtLnNwZWVkU21vb3RoO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5sZm9QaXRjaFRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBzcGVlZCAtPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNpbigoc3RyZWFtLnBvc2l0aW9uIC8gdGhpcy5hdWRpby5zYW1wbGVSYXRlKSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMCAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubGZvUGl0Y2hUaW1lKSAqIHN0cmVhbS5sZm9QaXRjaEFtb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBzcGVlZCArPSBNYXRoLnBvdyhzdHJlYW0ubGZvUGl0Y2hBbW91bnQgKiAwLjUsIDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnBvc2l0aW9uICs9IHNwZWVkO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWF4ID0gMTtcclxuICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gPSBNYXRoLm1pbihNYXRoLm1heChvdXRwdXRMZWZ0W2pdLCAtbWF4KSwgbWF4KTtcclxuICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdID0gTWF0aC5taW4oTWF0aC5tYXgob3V0cHV0UmlnaHRbal0sIC1tYXgpLCBtYXgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShvdXRwdXRMZWZ0W2pdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShvdXRwdXRSaWdodFtqXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjbG9zZSgpIHtcclxuICAgICAgICB0aGlzLmF1ZGlvLmRlc3RpbmF0aW9uLmRpc2Nvbm5lY3QoKTtcclxuICAgIH1cclxuICAgIGFzeW5jIGNyZWF0ZVN0cmVhbShpZCwgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICBpZiAoc2tpcENhY2hlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHNraXBDYWNoZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHRoaXMuZmFjdG9yeS5jcmVhdGVTdHJlYW0odGhpcy5hdWRpbywgdXJsLCBza2lwQ2FjaGUpO1xyXG4gICAgICAgIHRoaXMuc3RyZWFtTG9va3VwLnNldChpZCwgc3RyZWFtKTtcclxuICAgICAgICB0aGlzLnN0cmVhbXMucHVzaChzdHJlYW0pO1xyXG4gICAgICAgIHJldHVybiBzdHJlYW07XHJcbiAgICB9XHJcbiAgICBkZXN0cm95U3RyZWFtKGlkKSB7XHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gdGhpcy5zdHJlYW1Mb29rdXAuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIXN0cmVhbSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuc3RyZWFtTG9va3VwLmRlbGV0ZShpZCk7XHJcbiAgICAgICAgdGhpcy5mYWN0b3J5LmRlc3Ryb3lTdHJlYW0oc3RyZWFtKTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuc3RyZWFtcy5pbmRleE9mKHN0cmVhbSk7XHJcbiAgICAgICAgdGhpcy5zdHJlYW1zLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gV2ViQXVkaW87XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC50c1wiKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=