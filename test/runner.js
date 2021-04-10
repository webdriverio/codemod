const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const expect = require('expect')

const Runner = require('jscodeshift/src/Runner')

const frameworkTests = {
    protractor: [
        ['./conf.js', './conf.js'],
        ['./spec.js', './spec.js'],
        ['./element.js', './element.js'],
        ['./locators.js', './locators.js'],
        ['./failing_byBinding.js'],
        ['./failing_byCssContainingTextRegex.js'],
        ['./failing_touchActions.js'],
        ['./failing_actions.js'],
        ['./failing_setLocation.js'],
        ['./failing_unsupported.js'],
        ['./failing_evaluate.js'],
        ['./failing_getCssValue.js']
    ]
}

let error

async function runTest (framework, tests) {
    shell.cp(
        '-r',
        path.join(__dirname, '__fixtures__', framework, 'source'),
        path.join(__dirname, 'testdata')
    )
    for ([source, desired] of tests) {
        const srcFile = path.join(__dirname, 'testdata', source)

        const result = await Runner.run(
            path.resolve(path.join(__dirname, '..', framework, 'index.js')),
            [srcFile],
            {
                verbose: 2
            }
        )

        if (result.error) {
            if (desired) {
                throw new Error(`Failed to compile ${source} to ${desired}`)
            }

            continue
        }

        const fixtureFile = path.join(__dirname, '__fixtures__', framework, 'transformed', desired)
        const sourceFileContent = (await fs.promises.readFile(srcFile)).toString()
        const desiredFileContent = (await fs.promises.readFile(fixtureFile)).toString()

        expect(sourceFileContent).toEqual(desiredFileContent)
    }
}

;(async () => {
    for (const [framework, tests] of Object.entries(frameworkTests)) {
        console.log('========================')
        console.log(`Run tests for ${framework}`)
        console.log('========================\n')
        await runTest(framework, tests)
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
