/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const ChatsoundsParser_1 = __importDefault(__webpack_require__(/*! ./parser/ChatsoundsParser */ "./src/parser/ChatsoundsParser.ts"));
const WebAudio_1 = __importDefault(__webpack_require__(/*! ./webaudio/WebAudio */ "./src/webaudio/WebAudio.ts"));
function exampleStream() {
    return __awaiter(this, void 0, void 0, function* () {
        const webAudio = new WebAudio_1.default();
        const stream = yield webAudio.createStream("identifier", "https://google.com");
        stream.play();
        webAudio.close();
    });
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
        console.log(modifiers);
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
    // EXPERIMENTAL
    parse(input) {
        let ret = [];
        const modifierContexts = this.parseModifiers(input);
        for (const ctx of modifierContexts) {
            ret = ret.concat(this.parseContext(ctx));
        }
        return ret;
    }
    // EXPERIMENTAL
    parseModifiers(input) {
        var _a;
        // look for "(" and ")" because they create contextual modifiers
        if (!input.match(/\(\)/g))
            return [new ChatsoundModifier_1.ChatsoundContextModifier(input, [])];
        const ret = [];
        let depth = 0;
        let depthTmp = new Map();
        let isModifier = false;
        let lastCtx = undefined;
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            if (!isModifier) {
                if (char === "(") {
                    depth++;
                }
                else if (char === ")") {
                    depth--;
                    const ctx = depthTmp.get(depth);
                    lastCtx = ctx;
                    if (ctx) {
                        ctx.parentContext = depthTmp.get(depth - 1);
                        ret.push(ctx);
                        depthTmp.delete(depth);
                    }
                }
            }
            const ctx = (_a = depthTmp.get(depth)) !== null && _a !== void 0 ? _a : new ChatsoundModifier_1.ChatsoundContextModifier("", []);
            ctx.content += char;
            depthTmp.set(depth, ctx);
        }
        return ret;
    }
    // EXPERIMENTAL
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

/***/ "./src/parser/modifiers/index.ts":
/*!***************************************!*\
  !*** ./src/parser/modifiers/index.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! . */ "./src/parser/modifiers/index.ts"), exports);


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


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Stream_1 = __importDefault(__webpack_require__(/*! ./Stream */ "./src/webaudio/Stream.ts"));
class StreamFactory {
    constructor() {
        this.bufferCache = new Map();
    }
    downloadBuffer(audio, url, skipCache) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    createStream(audio, url, skipCache) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield this.downloadBuffer(audio, url, skipCache);
            return new Stream_1.default(buffer, audio, url);
        });
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


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    createStream(id, url, skipCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (skipCache === undefined)
                skipCache = false;
            const stream = yield this.factory.createStream(this.audio, url, skipCache);
            this.streamLookup.set(id, stream);
            this.streams.push(stream);
            return stream;
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL0NoYXRzb3VuZC50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRNb2RpZmllci50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3BhcnNlci9DaGF0c291bmRzUGFyc2VyLnRzIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvLi9zcmMvcGFyc2VyL21vZGlmaWVycy9pbmRleC50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3dlYmF1ZGlvL1N0cmVhbS50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyLy4vc3JjL3dlYmF1ZGlvL1N0cmVhbUZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vY2hhdHNvdW5kcy14LXdvcmtlci8uL3NyYy93ZWJhdWRpby9XZWJBdWRpby50cyIsIndlYnBhY2s6Ly9jaGF0c291bmRzLXgtd29ya2VyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2NoYXRzb3VuZHMteC13b3JrZXIvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBYTtBQUNiO0FBQ0EsMkJBQTJCLCtEQUErRCxnQkFBZ0IsRUFBRSxFQUFFO0FBQzlHO0FBQ0EsbUNBQW1DLE1BQU0sNkJBQTZCLEVBQUUsWUFBWSxXQUFXLEVBQUU7QUFDakcsa0NBQWtDLE1BQU0saUNBQWlDLEVBQUUsWUFBWSxXQUFXLEVBQUU7QUFDcEcsK0JBQStCLHFGQUFxRjtBQUNwSDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0EsOENBQTZDLENBQUMsY0FBYyxFQUFDO0FBQzdELDJDQUEyQyxtQkFBTyxDQUFDLG1FQUEyQjtB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XCI7XHJcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufTtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBDaGF0c291bmRzUGFyc2VyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vcGFyc2VyL0NoYXRzb3VuZHNQYXJzZXJcIikpO1xyXG5jb25zdCBXZWJBdWRpb18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3dlYmF1ZGlvL1dlYkF1ZGlvXCIpKTtcclxuZnVuY3Rpb24gZXhhbXBsZVN0cmVhbSgpIHtcclxuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XHJcbiAgICAgICAgY29uc3Qgd2ViQXVkaW8gPSBuZXcgV2ViQXVkaW9fMS5kZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0geWllbGQgd2ViQXVkaW8uY3JlYXRlU3RyZWFtKFwiaWRlbnRpZmllclwiLCBcImh0dHBzOi8vZ29vZ2xlLmNvbVwiKTtcclxuICAgICAgICBzdHJlYW0ucGxheSgpO1xyXG4gICAgICAgIHdlYkF1ZGlvLmNsb3NlKCk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBleGFtcGxlUGFyc2UoaW5wdXQpIHtcclxuICAgIGNvbnN0IGxvb2t1cCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBDaGF0c291bmRzUGFyc2VyXzEuZGVmYXVsdChsb29rdXApO1xyXG4gICAgY29uc3QgY2hhdHNvdW5kcyA9IHBhcnNlci5wYXJzZShpbnB1dCk7XHJcbiAgICBmb3IgKGNvbnN0IGNzIG9mIGNoYXRzb3VuZHMpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhjcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hhdHNvdW5kcztcclxufVxyXG5leGFtcGxlUGFyc2UoXCJhd2R3YWReNTAgbG9sJTI1IChoIHdoeSBhcmUgd2Ugc3RpbGwgaGVyZSk6cGl0Y2goLTEpIGhlbGxvIHRoZXJlOmVjaG9cIik7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNsYXNzIENoYXRzb3VuZCB7XHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCB1cmwpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIHRoaXMubW9kaWZpZXJzID0gW107XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5kZWZhdWx0ID0gQ2hhdHNvdW5kO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5leHBvcnRzLkNoYXRzb3VuZENvbnRleHRNb2RpZmllciA9IHZvaWQgMDtcclxuY2xhc3MgQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNvbnRlbnQsIG1vZGlmaWVycykge1xyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICAgICAgdGhpcy5tb2RpZmllcnMgPSBtb2RpZmllcnM7XHJcbiAgICB9XHJcbiAgICBnZXRBbGxNb2RpZmllcnMoKSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGxldCBjdHggPSB0aGlzO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgcmV0ID0gcmV0LmNvbmNhdChjdHgubW9kaWZpZXJzKTtcclxuICAgICAgICAgICAgY3R4ID0gY3R4LnBhcmVudENvbnRleHQ7XHJcbiAgICAgICAgfSB3aGlsZSAoY3R4KTtcclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyID0gQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pKTtcclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19zZXRNb2R1bGVEZWZhdWx0KSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59KTtcclxudmFyIF9faW1wb3J0U3RhciA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnRTdGFyKSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY29uc3QgQ2hhdHNvdW5kXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vQ2hhdHNvdW5kXCIpKTtcclxuY29uc3QgQ2hhdHNvdW5kTW9kaWZpZXJfMSA9IHJlcXVpcmUoXCIuL0NoYXRzb3VuZE1vZGlmaWVyXCIpO1xyXG5jb25zdCBtb2RpZmllcnMgPSBfX2ltcG9ydFN0YXIocmVxdWlyZShcIi4vbW9kaWZpZXJzXCIpKTtcclxuY2xhc3MgQ2hhdHNvdW5kc1BhcnNlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihsb29rdXApIHtcclxuICAgICAgICB0aGlzLmxvb2t1cCA9IGxvb2t1cDtcclxuICAgICAgICBjb25zb2xlLmxvZyhtb2RpZmllcnMpO1xyXG4gICAgfVxyXG4gICAgLypcclxuICAgICAgICBDVVJSRU5UIElNUEw6XHJcbiAgICAgICAgICAgIDEpIFBhcnNlIGNvbnRleHVhbCBtb2RpZmllcnMgZS5nIChhd2Rhd2QpOmVjaG8oMCwgMSlcclxuICAgICAgICAgICAgMikgUGFyc2UgY2hhdHNvdW5kIGluIHRoZSBjb250ZXh0IG9mIHRoZSBtb2RpZmllclxyXG4gICAgICAgICAgICAzKSBBcHBseSB0aGUgY29udGV4dCBtb2RpZmllcnMgdG8gZWFjaCBjaGF0c291bmRcclxuICAgICAgICAgICAgNCkgUmVwZWF0IDEpIDIpIDMpIHVudGlsIHRoZXJlcyBub3RoaW5nIGxlZnQgdG8gcGFyc2VcclxuICAgICAgICAgICAgNSkgcmV0dXJuIHRoZSBsaXN0IG9mIHBhcnNlZCBjaGF0c291bmRzIHdpdGggbW9kaWZpZXJzIGFwcGxpZWQgdG8gdGhlbVxyXG5cclxuICAgICAgICBQUk9CTEVNUzpcclxuICAgICAgICAgICAgLSBMZWdhY3kgbW9kaWZpZXJzIGFyZSBjaGF0c291bmQtYXdhcmUgYnV0IG5vdCBjb250ZXh0LWF3YXJlLCBtZWFuaW5nIHRoZXkgYWx3YXlzIHVzZSB0aGUgbGFzdCBjaGF0c291bmQgcGFyc2VkXHJcbiAgICAgICAgICAgIC0gQ29udGV4dHVhbCBtb2RpZmllcnMgY2FuIGJlIHVzZWQgaW4gYSBsZWdhY3kgZmFzaGlvbjogYXdkYXdkOmVjaG9cclxuICAgICAgICAgICAgLSBBcmd1bWVudHMgZm9yIGNvbnRleHR1YWwgbW9kaWZpZXJzIGFsc28gY29udGFpbiBwYXJlbnRoZXNpcyBhbmQgY2FuIGhhdmUgc3BhY2VzXHJcbiAgICAgICAgICAgIC0gTHVhIGV4cHJlc3Npb25zIGluIGNvbnRleHR1YWwgbW9kaWZpZXJzXHJcblxyXG4gICAgICAgIFBPU1NJQkxFIFNPTFVUSU9OOlxyXG4gICAgICAgICAgICBIYXZlIGEgbGlzdCBvZiBtb2RpZmllcnMgd2l0aCB0aGVpciBuYW1lcywgYnVpbGQgYSBnbG9iYWwgcmVnZXggb3V0IG9mIHRoZSBuYW1lcyBhbmQgcGF0dGVybnMgZm9yIHRoZXNlIG1vZGlmaWVyc1xyXG4gICAgICAgICAgICBGb3IgZWFjaCBtYXRjaCB3ZSBwYXJzZSB0aGUgc3RyaW5nIGZvciBjaGF0c291bmQgYmVmb3JlIHRoZSBtb2RpZmllcnMgd29yZCBwZXIgd29yZFxyXG4gICAgICAgICAgICBJZiB0aGUgdGhlIGZpcnN0IGNoYXJhY3RlciBiZWZvcmUgdGhlIG1vZGlmaWVyIGlzIFwiKVwiIHdlIGFwcGx5IHRoZSBtb2RpZmllciB0byBlYWNoIGNoYXRzb3VuZCBwYXJzZWQgdXAgdW50aWwgd2UgZmluZCBcIihcIlxyXG4gICAgICAgICAgICBJZiB0aGVyZSBpcyBubyBcIilcIiB0aGVuIGFwcGx5IHRoZSBtb2RpZmllciBvbmx5IHRvIHRoZSBsYXN0IGNoYXRzb3VuZCBwYXJzZWRcclxuICAgICAgICAgICAgUmV0dXJuIHRoZSBsaXN0IG9mIHBhcnNlZCBjaGF0c291bmRzIGFsb25nIHdpdGggdGhlaXIgbW9kaWZpZXJzXHJcblxyXG4gICAgICAgID0+IFRPRE9cclxuICAgICAgICAtPiBJbXBsZW1lbnQgbG9va3VwIHRhYmxlIGZvciBzb3VuZHMgLyB1cmxzXHJcbiAgICAgICAgLT4gSW1wbGVtZW50IG1vZGlmaWVyc1xyXG5cclxuICAgICovXHJcbiAgICAvLyBFWFBFUklNRU5UQUxcclxuICAgIHBhcnNlKGlucHV0KSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGNvbnN0IG1vZGlmaWVyQ29udGV4dHMgPSB0aGlzLnBhcnNlTW9kaWZpZXJzKGlucHV0KTtcclxuICAgICAgICBmb3IgKGNvbnN0IGN0eCBvZiBtb2RpZmllckNvbnRleHRzKSB7XHJcbiAgICAgICAgICAgIHJldCA9IHJldC5jb25jYXQodGhpcy5wYXJzZUNvbnRleHQoY3R4KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICAvLyBFWFBFUklNRU5UQUxcclxuICAgIHBhcnNlTW9kaWZpZXJzKGlucHV0KSB7XHJcbiAgICAgICAgdmFyIF9hO1xyXG4gICAgICAgIC8vIGxvb2sgZm9yIFwiKFwiIGFuZCBcIilcIiBiZWNhdXNlIHRoZXkgY3JlYXRlIGNvbnRleHR1YWwgbW9kaWZpZXJzXHJcbiAgICAgICAgaWYgKCFpbnB1dC5tYXRjaCgvXFwoXFwpL2cpKVxyXG4gICAgICAgICAgICByZXR1cm4gW25ldyBDaGF0c291bmRNb2RpZmllcl8xLkNoYXRzb3VuZENvbnRleHRNb2RpZmllcihpbnB1dCwgW10pXTtcclxuICAgICAgICBjb25zdCByZXQgPSBbXTtcclxuICAgICAgICBsZXQgZGVwdGggPSAwO1xyXG4gICAgICAgIGxldCBkZXB0aFRtcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBsZXQgaXNNb2RpZmllciA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsYXN0Q3R4ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY2hhciA9IGlucHV0W2ldO1xyXG4gICAgICAgICAgICBpZiAoIWlzTW9kaWZpZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjaGFyID09PSBcIihcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjaGFyID09PSBcIilcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoLS07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3R4ID0gZGVwdGhUbXAuZ2V0KGRlcHRoKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0Q3R4ID0gY3R4O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdHgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnBhcmVudENvbnRleHQgPSBkZXB0aFRtcC5nZXQoZGVwdGggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2goY3R4KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwdGhUbXAuZGVsZXRlKGRlcHRoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gKF9hID0gZGVwdGhUbXAuZ2V0KGRlcHRoKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogbmV3IENoYXRzb3VuZE1vZGlmaWVyXzEuQ2hhdHNvdW5kQ29udGV4dE1vZGlmaWVyKFwiXCIsIFtdKTtcclxuICAgICAgICAgICAgY3R4LmNvbnRlbnQgKz0gY2hhcjtcclxuICAgICAgICAgICAgZGVwdGhUbXAuc2V0KGRlcHRoLCBjdHgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgLy8gRVhQRVJJTUVOVEFMXHJcbiAgICBwYXJzZUNvbnRleHQoY3R4KSB7XHJcbiAgICAgICAgY29uc3QgcmV0ID0gW107XHJcbiAgICAgICAgY29uc3QgbW9kaWZpZXJzID0gY3R4LmdldEFsbE1vZGlmaWVycygpO1xyXG4gICAgICAgIGxldCB3b3JkcyA9IGN0eC5jb250ZW50LnNwbGl0KFwiIFwiKTtcclxuICAgICAgICBsZXQgZW5kID0gd29yZHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlICh3b3Jkcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gd29yZHMuc2xpY2UoMCwgZW5kKS5qb2luKFwiIFwiKTtcclxuICAgICAgICAgICAgY29uc3QgY2hhdHNvdW5kVXJsID0gdGhpcy5sb29rdXAuZ2V0KGNodW5rKTtcclxuICAgICAgICAgICAgaWYgKGNoYXRzb3VuZFVybCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hhdHNvdW5kID0gbmV3IENoYXRzb3VuZF8xLmRlZmF1bHQoY2h1bmssIGNoYXRzb3VuZFVybCk7XHJcbiAgICAgICAgICAgICAgICBjaGF0c291bmQubW9kaWZpZXJzID0gY2hhdHNvdW5kLm1vZGlmaWVycy5jb25jYXQobW9kaWZpZXJzKTsgLy8gYWRkIHRoZSBjb250ZXh0IG1vZGlmaWVyc1xyXG4gICAgICAgICAgICAgICAgcmV0LnB1c2goY2hhdHNvdW5kKTtcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgcGFyc2VkIGNoYXRzb3VuZCBhbmQgcmVzZXQgb3VyIHByb2Nlc3NpbmcgdmFyc1xyXG4gICAgICAgICAgICAgICAgLy8gc28gaXQncyBub3QgcGFyc2VkIHR3aWNlXHJcbiAgICAgICAgICAgICAgICB3b3JkcyA9IHdvcmRzLnNsaWNlKGVuZCwgd29yZHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGVuZCA9IHdvcmRzLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVuZC0tO1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhhdCBoYXBwZW5zIHdlIG1hdGNoZWQgbm90aGluZyBmcm9tIHdoZXJlIHdlIHN0YXJ0ZWRcclxuICAgICAgICAgICAgICAgIC8vIHNvIHN0YXJ0IGZyb20gdGhlIG5leHQgd29yZFxyXG4gICAgICAgICAgICAgICAgaWYgKGVuZCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd29yZHMuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICBlbmQgPSB3b3Jkcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBDaGF0c291bmRzUGFyc2VyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fY3JlYXRlQmluZGluZyA9ICh0aGlzICYmIHRoaXMuX19jcmVhdGVCaW5kaW5nKSB8fCAoT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbVtrXTsgfSB9KTtcclxufSkgOiAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBvW2syXSA9IG1ba107XHJcbn0pKTtcclxudmFyIF9fZXhwb3J0U3RhciA9ICh0aGlzICYmIHRoaXMuX19leHBvcnRTdGFyKSB8fCBmdW5jdGlvbihtLCBleHBvcnRzKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmIChwICE9PSBcImRlZmF1bHRcIiAmJiAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydHMsIHApKSBfX2NyZWF0ZUJpbmRpbmcoZXhwb3J0cywgbSwgcCk7XHJcbn07XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuX19leHBvcnRTdGFyKHJlcXVpcmUoXCIuXCIpLCBleHBvcnRzKTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuY2xhc3MgU3RyZWFtIHtcclxuICAgIGNvbnN0cnVjdG9yKGJ1ZmZlciwgYXVkaW8sIHVybCkge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSAwO1xyXG4gICAgICAgIHRoaXMuc3BlZWQgPSAxOyAvLyAxID0gbm9ybWFsIHBpdGNoXHJcbiAgICAgICAgdGhpcy5tYXhMb29wID0gMTsgLy8gLTEgPSBpbmZcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5kb25lUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMucmV2ZXJzZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vIHNtb290aGluZ1xyXG4gICAgICAgIHRoaXMudXNlU21vb3RoaW5nID0gdHJ1ZTtcclxuICAgICAgICAvLyBmaWx0ZXJpbmdcclxuICAgICAgICB0aGlzLmZpbHRlclR5cGUgPSAwO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyRnJhY3Rpb24gPSAxO1xyXG4gICAgICAgIC8vIGVjaG9cclxuICAgICAgICB0aGlzLnVzZUVjaG8gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmVjaG9GZWVkYmFjayA9IDAuNzU7XHJcbiAgICAgICAgdGhpcy5lY2hvQnVmZmVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuZWNob1ZvbHVtZSA9IDA7XHJcbiAgICAgICAgdGhpcy5lY2hvRGVsYXkgPSAwO1xyXG4gICAgICAgIC8vIHZvbHVtZVxyXG4gICAgICAgIHRoaXMudm9sdW1lQm90aCA9IDE7XHJcbiAgICAgICAgdGhpcy52b2x1bWVMZWZ0ID0gMTtcclxuICAgICAgICB0aGlzLnZvbHVtZVJpZ2h0ID0gMTtcclxuICAgICAgICB0aGlzLnZvbHVtZUxlZnRTbW9vdGggPSAwO1xyXG4gICAgICAgIHRoaXMudm9sdW1lUmlnaHRTbW9vdGggPSAwO1xyXG4gICAgICAgIC8vIGxmb1xyXG4gICAgICAgIHRoaXMubGZvVm9sdW1lVGltZSA9IDE7XHJcbiAgICAgICAgdGhpcy5sZm9Wb2x1bWVBbW91bnQgPSAwO1xyXG4gICAgICAgIHRoaXMubGZvUGl0Y2hUaW1lID0gMTtcclxuICAgICAgICB0aGlzLmxmb1BpdGNoQW1vdW50ID0gMDtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcclxuICAgICAgICB0aGlzLmF1ZGlvID0gYXVkaW87XHJcbiAgICAgICAgdGhpcy5zcGVlZFNtb290aCA9IHRoaXMuc3BlZWQ7XHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICB9XHJcbiAgICBwbGF5KCkge1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSAwO1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBzdG9wKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB1c2VGRlQoXykge1xyXG4gICAgICAgIC8vIGxhdGVyXHJcbiAgICB9XHJcbiAgICBzZXRVc2VFY2hvKGVuYWJsZSkge1xyXG4gICAgICAgIHRoaXMudXNlRWNobyA9IGVuYWJsZTtcclxuICAgICAgICBpZiAoZW5hYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0RWNob0RlbGF5KHRoaXMuZWNob0RlbGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWNob0J1ZmZlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzZXRFY2hvRGVsYXkoZGVsYXkpIHtcclxuICAgICAgICBpZiAodGhpcy51c2VFY2hvICYmICghdGhpcy5lY2hvQnVmZmVyIHx8IGRlbGF5ICE9IHRoaXMuZWNob0J1ZmZlci5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIGxldCBzaXplID0gMTtcclxuICAgICAgICAgICAgd2hpbGUgKChzaXplIDw8PSAxKSA8IGRlbGF5KVxyXG4gICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICB0aGlzLmVjaG9CdWZmZXIgPSB0aGlzLmF1ZGlvLmNyZWF0ZUJ1ZmZlcigyLCBzaXplLCB0aGlzLmF1ZGlvLnNhbXBsZVJhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVjaG9EZWxheSA9IGRlbGF5O1xyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufTtcclxudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcclxufTtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG5jb25zdCBTdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TdHJlYW1cIikpO1xyXG5jbGFzcyBTdHJlYW1GYWN0b3J5IHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcbiAgICBkb3dubG9hZEJ1ZmZlcihhdWRpbywgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlckNhY2hlLmdldCh1cmwpO1xyXG4gICAgICAgICAgICBpZiAoIXNraXBDYWNoZSAmJiBidWZmZXIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBidWZmZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGF1ZGlvLmRlY29kZUF1ZGlvRGF0YShyZXF1ZXN0LnJlc3BvbnNlLCAoYnVmZmVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUuc2V0KHVybCwgYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShidWZmZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIChlcnIpID0+IHJlamVjdChlcnIpKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVN0cmVhbShhdWRpbywgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSB5aWVsZCB0aGlzLmRvd25sb2FkQnVmZmVyKGF1ZGlvLCB1cmwsIHNraXBDYWNoZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3RyZWFtXzEuZGVmYXVsdChidWZmZXIsIGF1ZGlvLCB1cmwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZGVzdHJveVN0cmVhbShzdHJlYW0pIHtcclxuICAgICAgICBpZiAoc3RyZWFtKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyQ2FjaGUuZGVsZXRlKHN0cmVhbS51cmwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBTdHJlYW1GYWN0b3J5O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59O1xyXG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xyXG59O1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmNvbnN0IFN0cmVhbUZhY3RvcnlfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TdHJlYW1GYWN0b3J5XCIpKTtcclxuY29uc3QgQlVGRkVSX1NJWkUgPSAxMDI0O1xyXG5jbGFzcyBXZWJBdWRpbyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnN0cmVhbXMgPSBbXTtcclxuICAgICAgICB0aGlzLmZhY3RvcnkgPSBuZXcgU3RyZWFtRmFjdG9yeV8xLmRlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLnN0cmVhbUxvb2t1cCA9IG5ldyBNYXAoKTtcclxuICAgICAgICB0aGlzLmF1ZGlvID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yID0gdGhpcy5hdWRpby5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoQlVGRkVSX1NJWkUsIDIsIDIpO1xyXG4gICAgICAgIHRoaXMuZ2FpbiA9IHRoaXMuYXVkaW8uY3JlYXRlR2FpbigpO1xyXG4gICAgICAgIHRoaXMuY29tcHJlc3NvciA9IHRoaXMuYXVkaW8uY3JlYXRlRHluYW1pY3NDb21wcmVzc29yKCk7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzb3Iub25hdWRpb3Byb2Nlc3MgPSAoZXYpID0+IHRoaXMub25BdWRpb1Byb2Nlc3MoZXYpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc29yLmNvbm5lY3QodGhpcy5jb21wcmVzc29yKTtcclxuICAgICAgICB0aGlzLmNvbXByZXNzb3IuY29ubmVjdCh0aGlzLmdhaW4pO1xyXG4gICAgICAgIHRoaXMuZ2Fpbi5jb25uZWN0KHRoaXMuYXVkaW8uZGVzdGluYXRpb24pO1xyXG4gICAgfVxyXG4gICAgb25BdWRpb1Byb2Nlc3MoZXZlbnQpIHtcclxuICAgICAgICBsZXQgb3V0cHV0TGVmdCA9IGV2ZW50Lm91dHB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICBsZXQgb3V0cHV0UmlnaHQgPSBldmVudC5vdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudC5vdXRwdXRCdWZmZXIubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgb3V0cHV0TGVmdFtpXSA9IDA7XHJcbiAgICAgICAgICAgIG91dHB1dFJpZ2h0W2ldID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnN0cmVhbXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3RyZWFtID0gdGhpcy5zdHJlYW1zW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBidWZmZXJMZW4gPSBzdHJlYW0uYnVmZmVyLmxlbmd0aDtcclxuICAgICAgICAgICAgY29uc3QgYnVmZmVyTGVmdCA9IHN0cmVhbS5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlclJpZ2h0ID0gc3RyZWFtLmJ1ZmZlci5udW1iZXJPZkNoYW5uZWxzID09PSAxXHJcbiAgICAgICAgICAgICAgICA/IGJ1ZmZlckxlZnRcclxuICAgICAgICAgICAgICAgIDogc3RyZWFtLmJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS51c2VTbW9vdGhpbmcpIHtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5zcGVlZFNtb290aCA9XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnNwZWVkU21vb3RoICsgKHN0cmVhbS5zcGVlZCAtIHN0cmVhbS5zcGVlZFNtb290aCkgKiAxO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGggPVxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHN0cmVhbS52b2x1bWVMZWZ0IC0gc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGgpICogMTtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCA9XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZVJpZ2h0U21vb3RoICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKHN0cmVhbS52b2x1bWVSaWdodCAtIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCkgKiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNwZWVkU21vb3RoID0gc3RyZWFtLnNwZWVkO1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnZvbHVtZUxlZnRTbW9vdGggPSBzdHJlYW0udm9sdW1lTGVmdFNtb290aDtcclxuICAgICAgICAgICAgICAgIHN0cmVhbS52b2x1bWVSaWdodFNtb290aCA9IHN0cmVhbS52b2x1bWVSaWdodFNtb290aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXN0cmVhbS51c2VFY2hvICYmIChzdHJlYW0ucGF1c2VkIHx8IChzdHJlYW0udm9sdW1lTGVmdCA8IDAuMDAxICYmIHN0cmVhbS52b2x1bWVSaWdodCA8IDAuMDAxKSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBlY2hvbCA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgZWNob3IgPSBbXTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS51c2VFY2hvICYmIHN0cmVhbS5lY2hvQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBlY2hvbCA9IHN0cmVhbS5lY2hvQnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG4gICAgICAgICAgICAgICAgZWNob3IgPSBzdHJlYW0uZWNob0J1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgc21sID0gMDtcclxuICAgICAgICAgICAgbGV0IHNtciA9IDA7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZXZlbnQub3V0cHV0QnVmZmVyLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnBhdXNlZCB8fCAoc3RyZWFtLm1heExvb3AgPiAwICYmIHN0cmVhbS5wb3NpdGlvbiA+IGJ1ZmZlckxlbiAqIHN0cmVhbS5tYXhMb29wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5kb25lUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHJlYW0ucGF1c2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0cmVhbS51c2VFY2hvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5kb25lUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gKHN0cmVhbS5wb3NpdGlvbiA+PiAwKSAlIGJ1ZmZlckxlbjtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ucmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gLWluZGV4ICsgYnVmZmVyTGVuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IGxlZnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJpZ2h0ID0gMDtcclxuICAgICAgICAgICAgICAgIGlmICghc3RyZWFtLmRvbmVQbGF5aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVyc1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZmlsdGVyVHlwZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBOb25lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBidWZmZXJMZWZ0W2luZGV4XSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodCA9IGJ1ZmZlclJpZ2h0W2luZGV4XSAqIHN0cmVhbS52b2x1bWVCb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc21sID0gc21sICsgKGJ1ZmZlckxlZnRbaW5kZXhdIC0gc21sKSAqIHN0cmVhbS5maWx0ZXJGcmFjdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc21yID0gc21yICsgKGJ1ZmZlclJpZ2h0W2luZGV4XSAtIHNtcikgKiBzdHJlYW0uZmlsdGVyRnJhY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uZmlsdGVyVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTG93IHBhc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBzbWwgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gc21yICogc3RyZWFtLnZvbHVtZUJvdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLmZpbHRlclR5cGUgPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhpZ2ggcGFzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IChidWZmZXJMZWZ0W2luZGV4XSAtIHNtbCkgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gKGJ1ZmZlclJpZ2h0W2luZGV4XSAtIHNtcikgKiBzdHJlYW0udm9sdW1lQm90aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gTWF0aC5taW4oTWF0aC5tYXgobGVmdCwgLTEpLCAxKSAqIHN0cmVhbS52b2x1bWVMZWZ0U21vb3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gTWF0aC5taW4oTWF0aC5tYXgocmlnaHQsIC0xKSwgMSkgKiBzdHJlYW0udm9sdW1lUmlnaHRTbW9vdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmxmb1ZvbHVtZVRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBNYXRoLnNpbigoc3RyZWFtLnBvc2l0aW9uIC8gdGhpcy5hdWRpby5zYW1wbGVSYXRlKSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDEwICpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmxmb1ZvbHVtZVRpbWUpICogc3RyZWFtLmxmb1ZvbHVtZUFtb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0ICo9IHJlcztcclxuICAgICAgICAgICAgICAgICAgICByaWdodCAqPSByZXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnVzZUVjaG8pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlY2hvSW5kZXggPSAoc3RyZWFtLnBvc2l0aW9uID4+IDApICUgc3RyZWFtLmVjaG9EZWxheTtcclxuICAgICAgICAgICAgICAgICAgICBlY2hvbFtlY2hvSW5kZXhdICo9IHN0cmVhbS5lY2hvRmVlZGJhY2sgKyBsZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGVjaG9yW2VjaG9JbmRleF0gKj0gc3RyZWFtLmVjaG9GZWVkYmFjayArIHJpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gKz0gZWNob2xbZWNob0luZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSArPSBlY2hvcltlY2hvSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0TGVmdFtqXSArPSBsZWZ0O1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdICs9IHJpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHNwZWVkID0gc3RyZWFtLnNwZWVkU21vb3RoO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5sZm9QaXRjaFRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBzcGVlZCAtPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNpbigoc3RyZWFtLnBvc2l0aW9uIC8gdGhpcy5hdWRpby5zYW1wbGVSYXRlKSAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMCAqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubGZvUGl0Y2hUaW1lKSAqIHN0cmVhbS5sZm9QaXRjaEFtb3VudDtcclxuICAgICAgICAgICAgICAgICAgICBzcGVlZCArPSBNYXRoLnBvdyhzdHJlYW0ubGZvUGl0Y2hBbW91bnQgKiAwLjUsIDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnBvc2l0aW9uICs9IHNwZWVkO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWF4ID0gMTtcclxuICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gPSBNYXRoLm1pbihNYXRoLm1heChvdXRwdXRMZWZ0W2pdLCAtbWF4KSwgbWF4KTtcclxuICAgICAgICAgICAgICAgIG91dHB1dFJpZ2h0W2pdID0gTWF0aC5taW4oTWF0aC5tYXgob3V0cHV0UmlnaHRbal0sIC1tYXgpLCBtYXgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShvdXRwdXRMZWZ0W2pdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dExlZnRbal0gPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShvdXRwdXRSaWdodFtqXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRSaWdodFtqXSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjbG9zZSgpIHtcclxuICAgICAgICB0aGlzLmF1ZGlvLmRlc3RpbmF0aW9uLmRpc2Nvbm5lY3QoKTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVN0cmVhbShpZCwgdXJsLCBza2lwQ2FjaGUpIHtcclxuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xyXG4gICAgICAgICAgICBpZiAoc2tpcENhY2hlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICBza2lwQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgY29uc3Qgc3RyZWFtID0geWllbGQgdGhpcy5mYWN0b3J5LmNyZWF0ZVN0cmVhbSh0aGlzLmF1ZGlvLCB1cmwsIHNraXBDYWNoZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3RyZWFtTG9va3VwLnNldChpZCwgc3RyZWFtKTtcclxuICAgICAgICAgICAgdGhpcy5zdHJlYW1zLnB1c2goc3RyZWFtKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGRlc3Ryb3lTdHJlYW0oaWQpIHtcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSB0aGlzLnN0cmVhbUxvb2t1cC5nZXQoaWQpO1xyXG4gICAgICAgIGlmICghc3RyZWFtKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zdHJlYW1Mb29rdXAuZGVsZXRlKGlkKTtcclxuICAgICAgICB0aGlzLmZhY3RvcnkuZGVzdHJveVN0cmVhbShzdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zdHJlYW1zLmluZGV4T2Yoc3RyZWFtKTtcclxuICAgICAgICB0aGlzLnN0cmVhbXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxufVxyXG5leHBvcnRzLmRlZmF1bHQgPSBXZWJBdWRpbztcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==