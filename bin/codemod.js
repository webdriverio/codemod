#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const Runner = require('jscodeshift/src/Runner')
const pkg = require('../package.json')

const ROOT_DIR = path.resolve(__dirname, '..')
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage'])
const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts'])
const JS_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs'])

function getAvailableTransforms () {
    return fs.readdirSync(ROOT_DIR, { withFileTypes: true })
        .filter((entry) => (
            entry.isDirectory() &&
            !IGNORED_DIRS.has(entry.name) &&
            entry.name !== 'test' &&
            entry.name !== 'common' &&
            entry.name !== 'bin' &&
            fs.existsSync(path.join(ROOT_DIR, entry.name, 'index.js'))
        ))
        .map((entry) => entry.name)
}

function isTransformName (arg, availableTransforms) {
    if (arg.startsWith('.') || arg.startsWith('/') || arg.includes(path.sep)) {
        return false
    }
    return availableTransforms.includes(arg)
}

function parsePrintOptions (raw) {
    return JSON.parse(raw.replace(/\r/g, '\\r').replace(/\n/g, '\\n'))
}

function parseCliArgs (argv, availableTransforms = getAvailableTransforms()) {
    const transforms = []
    const targetPaths = []
    const options = {}

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i]

        if (arg === '--help' || arg === '-h') {
            options.help = true
            continue
        }
        if (arg === '--version' || arg === '-v') {
            options.version = true
            continue
        }
        if (arg === '--dry' || arg === '-d') {
            options.dry = true
            continue
        }
        if (arg === '--print') {
            options.print = true
            continue
        }
        if (arg.startsWith('--parser=')) {
            options.parser = arg.slice('--parser='.length)
            continue
        }
        if ((arg === '--parser' || arg === '-p') && i + 1 < argv.length) {
            options.parser = argv[i + 1]
            i += 1
            continue
        }
        if (arg.startsWith('--extensions=')) {
            options.extensions = arg.slice('--extensions='.length)
            continue
        }
        if (arg === '--extensions' && i + 1 < argv.length) {
            options.extensions = argv[i + 1]
            i += 1
            continue
        }
        if (arg.startsWith('--verbose=')) {
            options.verbose = Number(arg.slice('--verbose='.length))
            continue
        }
        if (arg === '--verbose') {
            options.verbose = 2
            continue
        }
        if (arg.startsWith('--printOptions=')) {
            options.printOptions = parsePrintOptions(arg.slice('--printOptions='.length))
            continue
        }
        if (arg === '--printOptions' && i + 1 < argv.length) {
            options.printOptions = parsePrintOptions(argv[i + 1])
            i += 1
            continue
        }
        if (arg.startsWith('-')) {
            continue
        }

        if (targetPaths.length === 0 && isTransformName(arg, availableTransforms)) {
            transforms.push(arg)
        } else {
            targetPaths.push(arg)
        }
    }

    return {
        transforms,
        targetPaths: targetPaths.length ? targetPaths : ['.'],
        options
    }
}

function collectSourceFiles (targetPaths, maxFiles = 500) {
    const files = []

    function walk (currentPath) {
        if (files.length >= maxFiles || !fs.existsSync(currentPath)) {
            return
        }

        const stat = fs.statSync(currentPath)
        if (stat.isFile()) {
            const ext = path.extname(currentPath).toLowerCase()
            if (TS_EXTENSIONS.has(ext) || JS_EXTENSIONS.has(ext)) {
                files.push(currentPath)
            }
            return
        }

        if (!stat.isDirectory()) {
            return
        }

        const entries = fs.readdirSync(currentPath, { withFileTypes: true })
        for (const entry of entries) {
            if (files.length >= maxFiles) {
                break
            }
            if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) {
                continue
            }
            walk(path.join(currentPath, entry.name))
        }
    }

    for (const target of targetPaths) {
        walk(path.resolve(target))
    }

    return files
}

function detectParser (targetPaths) {
    const files = collectSourceFiles(targetPaths)
    const hasTsFiles = files.some((file) => TS_EXTENSIONS.has(path.extname(file).toLowerCase()))
    return hasTsFiles ? 'tsx' : 'babel'
}

function printHelp (availableTransforms) {
    console.log(
        'Usage: codemod <transforms...> [paths...] [options]\n\n' +
        `Available transforms: ${availableTransforms.join(', ')}\n\n` +
        'Examples:\n' +
        '  npx @wdio/codemod protractor ./e2e/\n' +
        '  npx @wdio/codemod v6 v7 ./e2e/\n' +
        '  npx codemod async ./test/specs/\n\n' +
        'Options:\n' +
        '  -p, --parser <parser>        Parser to use (babel, tsx)\n' +
        '  --extensions <exts>          Comma-separated file extensions (default: js,jsx,ts,tsx)\n' +
        '  -d, --dry                    Dry run (no changes are made to files)\n' +
        '  --print                      Print transformed files to stdout\n' +
        '  --verbose[=<level>]          Show more information about the transform process\n' +
        '  --printOptions <json>        Options passed to recast printer\n' +
        '  -v, --version                Print version number\n' +
        '  -h, --help                   Print this help message'
    )
}

async function run (argv = process.argv.slice(2), runner = Runner.run) {
    const availableTransforms = getAvailableTransforms()
    const { transforms, targetPaths, options } = parseCliArgs(argv, availableTransforms)

    if (options.version) {
        console.log(pkg.version)
        return 0
    }

    if (options.help) {
        printHelp(availableTransforms)
        return 0
    }

    if (transforms.length === 0) {
        console.error(
            'Error: Please specify at least one transform to run ' +
            `(${availableTransforms.join(', ')}).`
        )
        printHelp(availableTransforms)
        return 1
    }

    const parser = options.parser || detectParser(targetPaths)
    const extensions = options.extensions || 'js,jsx,ts,tsx'
    const resolvedPaths = targetPaths.map((targetPath) => path.resolve(targetPath))

    for (const transform of transforms) {
        const transformPath = path.resolve(ROOT_DIR, transform, 'index.js')
        const result = await runner(transformPath, resolvedPaths, {
            verbose: options.verbose ?? 0,
            dry: Boolean(options.dry),
            print: Boolean(options.print),
            parser,
            extensions,
            ignorePattern: ['**/node_modules/**'],
            ...(options.printOptions ? { printOptions: options.printOptions } : {})
        })

        if (result && result.error) {
            return 1
        }
    }

    return 0
}

if (require.main === module) {
    run().then(
        (code) => process.exit(code),
        (err) => {
            console.error(err)
            process.exit(1)
        }
    )
}

module.exports = {
    getAvailableTransforms,
    parseCliArgs,
    collectSourceFiles,
    detectParser,
    run
}
