import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import { mapEvents } from 'sigh-core/lib/stream'

function tslintTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log
  var Linter = require('tslint')

  // this task runs inside the subprocess to transform each event
  return event => {
    let linter = new Linter(event.projectPath, event.data, opts)
    let result = linter.lint();
    if (result.failureCount > 0) {
      result.output.split("\n").filter(v => !!v.trim()).forEach(line => log.warn("tslint", line))
    }
    return {};
  }
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return event => {

    if (event.type !== 'add' && event.type !== 'change') {
      return event
    }

    if (event.fileType !== 'ts' && event.fileType !== 'tsx') {
      return event
    }

    return compiler(_.pick(event, 'type', 'data', 'path', 'projectPath')).then(() => event)
  }
}

var pooledProc

export default function(op, opts = {}) {
  opts = Object.assign({}, opts, {
    formatter: "prose"
  });

  if (! pooledProc) {
    pooledProc = op.procPool.prepare(tslintTask, opts)
  }

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
