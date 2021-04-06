const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const expect = require('expect')

const Runner = require('jscodeshift/src/Runner')

const tests = [
    ['./example/spec.js', './__fixtures__/spec.js']
]

;(async () => {
    shell.cp(
        '-r',
        path.join(__dirname, '..', 'cookbook'),
        path.join(__dirname, 'testdata')
    )
    for ([source, desired] of tests) {
        const srcFile = path.join(__dirname, 'testdata', source)
        const fixtureFile = path.join(__dirname, desired)

        const a = await Runner.run(
            path.resolve(path.join(__dirname, '..', 'src', 'index.js')),
            [srcFile],
            {
                verbose: 2
            }
        )
        const sourceFileContent = (await fs.promises.readFile(srcFile)).toString()
        const desiredFileContent = (await fs.promises.readFile(fixtureFile)).toString()

        expect(sourceFileContent).toEqual(desiredFileContent)
    }
})().then(
    () => console.log('Tests passed ✅'),
    (err) => console.error(err.message)
).then(() => (
    shell.rm('-r', path.join(__dirname, 'testdata'))
))