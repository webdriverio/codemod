exports.config = {
    cucumberOpts: {
        requireModule: [
            () => {
                console.log('foo');
                require('ts-node').register({ transpileOnly: true });
                console.log('bar');
            }
        ]
    },

    jasmineOpts: {
        requires: [
            () => require('@babel/register')({
                ignore: []
            })
        ]
    },

    mochaOpts: {
        require: [
            async function () {
                require('tsconfig-paths').register({
                    baseUrl,
                    paths: tsConfig.compilerOptions.paths
                })
            }
        ]
    }
}
