'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _sighCoreLibStream = require('sigh-core/lib/stream');

function tslintTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log;
  var Linter = require('tslint');
  var fs = require("fs");

  // this task runs inside the subprocess to transform each event
  return function (event) {
    var linter = new Linter(event.sourcePath, fs.readFileSync(event.sourcePath, "utf8"), opts);
    var result = linter.lint();
    if (result.failureCount > 0) {
      result.output.split("\n").filter(function (v) {
        return !!v.trim();
      }).forEach(function (line) {
        return log.warn("tslint", line);
      });
    }
    return {};
  };
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return function (event) {

    if (event.type !== 'add' && event.type !== 'change') {
      return event;
    }

    if (event.fileType !== 'ts' && event.fileType !== 'tsx') {
      return event;
    }

    return compiler(_lodash2['default'].pick(event, 'sourcePath')).then(function () {
      return event;
    });
  };
}

var pooledProc;

exports['default'] = function (op) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  opts = Object.assign({}, opts, {
    formatter: "prose"
  });

  if (!pooledProc) {
    pooledProc = op.procPool.prepare(tslintTask, opts);
  }

  return (0, _sighCoreLibStream.mapEvents)(op.stream, adaptEvent(pooledProc));
};

module.exports = exports['default'];
//# sourceMappingURL=index.js.map