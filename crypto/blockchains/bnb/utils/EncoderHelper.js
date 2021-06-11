"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.size = exports["default"] = void 0;

const IsJs = require('./IsJs.js')

// typeToTyp3
//amino type convert
var _default = function _default(type) {
  if (IsJs["boolean"](type)) {
    return 0;
  }

  if (IsJs.number(type)) {
    if (IsJs.integer(type)) {
      return 0;
    } else {
      return 1;
    }
  }

  if (IsJs.string(type) || IsJs.array(type) || IsJs.object(type)) {
    return 2;
  }

  throw new Error("Invalid type \"".concat(type, "\"")); // Is this what's expected?
};

exports._default = _default

var size = function size(items, iter, acc) {
  if (acc === undefined) acc = 0;

  for (var i = 0; i < items.length; ++i) {
    acc += iter(items[i], i, acc);
  }

  return acc;
};

exports.size = size;
