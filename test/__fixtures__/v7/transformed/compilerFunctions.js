exports.config = {
    framework: 'jasmine',

    cucumberOpts: {
        requireModule: [() => {
            console.log('foo');
            console.log('bar');
        }]
    },

    jasmineOpts: {
        requires: []
    },

    mochaOpts: {
        require: [async function () {}]
    },

    autoCompileOpts: {
        autoCompile: true,

        tsNodeOpts: {
            transpileOnly: true
        },

        tsConfigPathsOpts: {
            baseUrl,
            paths: tsConfig.compilerOptions.paths
        },

        babelOpts: {
            ignore: []
        }
    }
}
