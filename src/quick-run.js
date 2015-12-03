const findScripts = require('./find-scripts')
const runNpmCommand = require('npm-utils').test
const join = require('path').join
const findup = require('findup')

function printAllScripts (pkg) {
  console.error('Available scripts are', Object.keys(pkg.scripts).join(', '))
}

const npmErrorLoggers = {
  errorOutput: '',
  npmErrorStarted: false,
  stdout: function (str) {
    process.stdout.write(str)
  },
  stderr: function (str) {
    if (npmErrorLoggers.npmErrorStarted) {
      return
    }
    npmErrorLoggers.errorOutput += str
    if (/npm ERR/.test(npmErrorLoggers.errorOutput)) {
      npmErrorLoggers.npmErrorStarted = true
      process.stderr.write('\n')
      return
    }
    // TODO buffer by line
    process.stderr.write(str)
  }
}

function runPrefix (prefix) {
  try {
    var fullPath = findup.sync(process.cwd(), 'package.json')
  } catch (e) {
    console.error('Cannot find package.json in the current folder and its ancestors')
    process.exit(-1)
  }
  const pkg = require(join(fullPath, 'package.json'))
  if (!pkg.scripts) {
    console.error('Cannot find any scripts in the current package')
    process.exit(-1)
  }

  if (!prefix) {
    printAllScripts(pkg)
    return
  }
  console.log('running command with prefix "' + prefix + '"')

  const candidates = findScripts(prefix, pkg.scripts)
  if (!candidates.length) {
    console.error('Cannot find any scripts starting with "%s"', prefix)
    printAllScripts(pkg)
    process.exit(-1)
  }
  if (candidates.length > 1) {
    console.error('Several scripts start with "%s":', prefix, candidates.join(', '))
    console.error('Be more specific')
    process.exit(-1)
  }

  var cmd = 'npm run ' + candidates[0]
  var extraArguments = process.argv.slice(3)
  if (extraArguments.length) {
    cmd += ' -- ' + extraArguments.join(' ')
  }

  runNpmCommand(cmd, npmErrorLoggers)
    .catch(function (result) {
      process.exit(result.code)
    })
}

module.exports = runPrefix
