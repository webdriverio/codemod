import { Given, When, Then } from "@cucumber/cucumber";
const { Given2, When2, Then2 } = require("@cucumber/cucumber");

exports.config = {
    framework: 'jasmine',

    autoCompileOpts: {
        autoCompile: true,

        babelOpts: {
            rootMode: 'upward',
            ignore: ['node_modules']
        },

        tsConfigPathsOpts: {
            foo: 'bar'
        },

        tsNodeOpts: {
            bar: 'foo'
        }
    },

    mochaOpts: {
        ui: 'bdd',
        timeout: 5000,
        require: ['/foo/bar']
    },

    jasmineOpts: {
        requires: []
    },

    cucumberOpts: {
        requireModule: []
    }
}
