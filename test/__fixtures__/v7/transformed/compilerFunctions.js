exports.config = {
    framework: 'jasmine',

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
    },

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
    }
}
