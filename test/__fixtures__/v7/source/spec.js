import { Given, When, Then } from 'cucumber';
const { Given2, When2, Then2 } = require('cucumber');

exports.config = {
    mochaOpts: {
        ui: 'bdd',
        timeout: 5000,
        require: [
            '@babel/register',
            'ts-node/register',
            '/foo/bar',
            'tsconfig-paths/register',
            [
                '@babel/register',
                {
                    rootMode: 'upward',
                    ignore: ['node_modules']
                }
            ]
        ]
    },

    jasmineOpts: {
        requires: [
            '@babel/register',
            'ts-node/register',
            ['tsconfig-paths/register', {
                foo: 'bar'
            }]
        ]
    },

    cucumberOpts: {
        requireModule: [
            '@babel/register',
            ['ts-node/register', {
                bar: 'foo'
            }],
            'tsconfig-paths/register'
        ]
    }
}
