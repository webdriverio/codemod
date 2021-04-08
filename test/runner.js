const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const expect = require('expect')

const Runner = require('jscodeshift/src/Runner')

const tests = [
    ['./example/spec.js', './__fixtures__/spec.js'],
    ['./example/failing_byBinding.js'],
    ['./example/failing_byCssContainingTextRegex.js']
]

let error
;(async () => {
    shell.cp(
        '-r',
        path.join(__dirname, '..', 'cookbook'),
        path.join(__dirname, 'testdata')
    )
    for ([source, desired] of tests) {
        const srcFile = path.join(__dirname, 'testdata', source)

        const result = await Runner.run(
            path.resolve(path.join(__dirname, '..', 'src', 'index.js')),
            [srcFile],
            {
                verbose: 2
            }
        )
        
        if (result.error) {
            if (desired) {
                throw new Error('Failed to compile')
            }
            
            continue
        }

        const fixtureFile = path.join(__dirname, desired)
        const sourceFileContent = (await fs.promises.readFile(srcFile)).toString()
        const desiredFileContent = (await fs.promises.readFile(fixtureFile)).toString()

        expect(sourceFileContent).toEqual(desiredFileContent)
    }
})().then(
    () => console.log('Tests passed ✅'),
    (err) => (error = err)
).then(() => {
    shell.rm('-r', path.join(__dirname, 'testdata'))

    if (error) {
        delete error.matcherResult
        console.warn(error)
        return process.exit(1)
    }
})