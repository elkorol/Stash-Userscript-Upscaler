"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _esrgan = require("../../../packages/shared/src/esrgan/esrgan");
var _constants = require("./constants.generated");
var getModelDefinition = function (scale, modelFileName) {
  return (0, _esrgan.getESRGANModelDefinition)({
    scale: scale,
    path: "models/".concat(scale, "x/model.json"),
    name: _constants.NAME,
    version: _constants.VERSION,
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
      modelFileName: modelFileName
    }
  });
};
var _default = getModelDefinition;
exports.default = _default;
module.exports = exports.default;