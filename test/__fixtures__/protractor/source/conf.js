// Tests for the calculator.
exports.config = {
    seleniumAddress: 'https://ondemand.saucelabs.com/wd/hub',
    capabilities: {
        'browserName': 'chrome',
        name: 'foobar',
        seleniumAddress: 'http://localhost:4444/wd/hub',
        maxInstances: 123,
        shardTestFiles: true
    },
    multiCapabilities: [{
        browserName: 'chrome'
    }],
    specs: [
        'spec.js'
    ],

    seleniumServerStartTimeout: 30000,
    sauceUser: process.env.SAUCE_USERNAME,
    sauceKey: process.env.SAUCE_ACCESS_KEY,
    sauceRegion: 'eu-central-1',
    testobjectUser: process.env.TESTOBJECT_USER,
    testobjectKey: process.env.TESTOBJECT_KEY,
    kobitonUser: process.env.KOBITON_USER,
    kobitonKey: process.env.KOBITON_KEY,
    browserstackUser: process.env.BROWSERSTACK_USER,
    browserstackKey: process.env.BROWSERSTACK_KEY,
    browserstackProxy: 'http://proxy.example.com:1234',
    suites: {
        smoke: 'spec/smoketests/*.js',
        full: 'spec/*.js'
    },
    maxSessions: 321,
    beforeLaunch: () => console.log('beforeLaunch hook'),
    onPrepare: () => console.log('onPrepare hook'),
    onComplete: () => console.log('onComplete hook'),
    onCleanUp: () => console.log('onCleanUp hook'),
    afterLaunch: () => console.log('afterLaunch hook'),
    webDriverLogDir: "/path/to/log/dir",
    jasmineNodeOpts: {
        showColors: true
    }
};
