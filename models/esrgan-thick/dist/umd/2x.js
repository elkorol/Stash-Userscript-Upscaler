(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.ESRGANThick2x = factory());
})(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	var _2x = {};

	var getModelDefinition$1 = {};

	var esrgan = {};

	var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
	    var extendStatics = function (d, b) {
	        extendStatics = Object.setPrototypeOf ||
	            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
	        return extendStatics(d, b);
	    };
	    return function (d, b) {
	        if (typeof b !== "function" && b !== null)
	            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
	    __assign = Object.assign || function(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	                t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	};
	var __rest = (commonjsGlobal && commonjsGlobal.__rest) || function (s, e) {
	    var t = {};
	    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
	        t[p] = s[p];
	    if (s != null && typeof Object.getOwnPropertySymbols === "function")
	        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
	            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
	                t[p[i]] = s[p[i]];
	        }
	    return t;
	};
	Object.defineProperty(esrgan, "__esModule", { value: true });
	esrgan.getESRGANModelDefinition = void 0;
	var isTensorArray = function (inputs) {
	    return Array.isArray(inputs);
	};
	var getInput = function (inputs) {
	    if (isTensorArray(inputs)) {
	        return inputs[0];
	    }
	    return inputs;
	};
	var getESRGANModelDefinition = function (_a) {
	    var scale = _a.scale, name = _a.name, version = _a.version, _b = _a.meta, architecture = _b.architecture, meta = __rest(_b, ["architecture"]), modelPath = _a.path;
	    var path = modelPath || "models/".concat(scale, "x/model.json");
	    if (architecture === 'rdn') {
	        return {
	            scale: scale,
	            modelType: 'layers',
	            _internals: {
	                path: path,
	                name: name,
	                version: version,
	            },
	            meta: __assign({ architecture: architecture }, meta),
	            inputRange: [0, 255,],
	            outputRange: [0, 255,],
	        };
	    }
	    var setup = function (tf) {
	        var Layer = tf.layers.Layer;
	        var BETA = 0.2;
	        var MultiplyBeta = (function (_super) {
	            __extends(MultiplyBeta, _super);
	            function MultiplyBeta() {
	                var _this = _super.call(this, {}) || this;
	                _this.beta = BETA;
	                return _this;
	            }
	            MultiplyBeta.prototype.call = function (inputs) {
	                return tf.mul(getInput(inputs), this.beta);
	            };
	            MultiplyBeta.className = 'MultiplyBeta';
	            return MultiplyBeta;
	        }(Layer));
	        var getPixelShuffle = function (_scale) {
	            var PixelShuffle = (function (_super) {
	                __extends(PixelShuffle, _super);
	                function PixelShuffle() {
	                    var _this = _super.call(this, {}) || this;
	                    _this.scale = _scale;
	                    return _this;
	                }
	                PixelShuffle.prototype.computeOutputShape = function (inputShape) {
	                    return [inputShape[0], inputShape[1], inputShape[2], 3,];
	                };
	                PixelShuffle.prototype.call = function (inputs) {
	                    return tf.depthToSpace(getInput(inputs), this.scale, 'NHWC');
	                };
	                PixelShuffle.className = "PixelShuffle".concat(scale, "x");
	                return PixelShuffle;
	            }(Layer));
	            return PixelShuffle;
	        };
	        [
	            MultiplyBeta,
	            getPixelShuffle(scale),
	        ].forEach(function (layer) {
	            tf.serialization.registerClass(layer);
	        });
	    };
	    return {
	        setup: setup,
	        scale: scale,
	        modelType: 'layers',
	        _internals: {
	            path: path,
	            name: name,
	            version: version,
	        },
	        meta: __assign({ architecture: architecture }, meta),
	        inputRange: [0, 1,],
	        outputRange: [0, 1,],
	    };
	};
	esrgan.getESRGANModelDefinition = getESRGANModelDefinition;

	var constants_generated = {};

	Object.defineProperty(constants_generated, "__esModule", { value: true });
	constants_generated.VERSION = constants_generated.NAME = void 0;
	constants_generated.NAME = "@upscalerjs/esrgan-thick";
	constants_generated.VERSION = "1.0.0-beta.13";

	Object.defineProperty(getModelDefinition$1, "__esModule", { value: true });
	var esrgan_1 = esrgan;
	var constants_generated_1 = constants_generated;
	var getModelDefinition = function (scale, modelFileName) { return (0, esrgan_1.getESRGANModelDefinition)({
	    scale: scale,
	    path: "models/".concat(scale, "x/model.json"),
	    name: constants_generated_1.NAME,
	    version: constants_generated_1.VERSION,
	    meta: {
	        C: 4,
	        D: 3,
	        G: 32,
	        G0: 64,
	        T: 10,
	        architecture: "rrdn",
	        patchSize: scale === 3 ? 129 : 128,
	        size: 'thick',
	        artifactReducing: false,
	        sharpening: false,
	        dataset: 'div2k',
	        modelFileName: modelFileName,
	    },
	}); };
	getModelDefinition$1.default = getModelDefinition;

	var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(_2x, "__esModule", { value: true });
	var getModelDefinition_1 = __importDefault(getModelDefinition$1);
	var _default = _2x.default = (0, getModelDefinition_1.default)(2, 'rrdn-C4-D3-G32-G064-T10-x2-patchsize128-compress100-sharpen0-datadiv2k-vary_cFalse_best-val_loss_epoch476');

	return _default;

}));
