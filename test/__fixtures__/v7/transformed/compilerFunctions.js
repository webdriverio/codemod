exports.config = {
    cucumberOpts: {
        requireModule: [() => {
            console.log('foo');
            console.log('bar');
        }]
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
    },

    jasmineOpts: {
        requires: []
    },

    mochaOpts: {
        require: [async function () {}]
    }
}
