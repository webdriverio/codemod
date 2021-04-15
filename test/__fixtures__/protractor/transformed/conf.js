exports.config = {
    protocol: "https",
    hostname: "ondemand.saucelabs.com",
    port: 443,
    path: "/wd/hub",

    capabilities: [{
        'browserName': 'chrome',

        "sauce:options": {
            name: "foobar"
        },

        protocol: "http",
        hostname: "localhost",
        port: 4444,
        path: "/wd/hub",
        maxInstances: 123,

        "goog:chromeOptions": {
            args: ['foobar']
        },

        "moz:firefoxOptions": {
            args: ['foobar']
        }
    }],

    capabilities: [{
        'browserName': 'chrome',
        protocol: "http",
        hostname: "localhost",
        port: 4444,
        path: "/wd/hub",
        maxInstances: 123
    }],

    specs: [
        'spec.js'
    ],

    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'eu-central-1',
    user: process.env.TESTOBJECT_USER,
    key: process.env.TESTOBJECT_KEY,
    user: process.env.KOBITON_USER,
    key: process.env.KOBITON_KEY,
    user: process.env.BROWSERSTACK_USER,
    key: process.env.BROWSERSTACK_KEY,

    suites: {
        smoke: ["spec/smoketests/*.js"],
        full: ["spec/*.js"]
    },

    maxInstances: 321,
    onPrepare: () => console.log('beforeLaunch hook'),

    before: () => {
        console.log('onPrepare hook')

        browser.setTimeout({
            implicit: 15000
        });
        browser.setTimeout({
            pageLoad: 15000
        });
        browser.setTimeout({
            script: 15000
        });
        browser.maximizeWindow();
        browser.minimizeWindow();
        browser.fullscreenWindow();
    },

    after: () => console.log('onComplete hook'),
    afterSession: () => console.log('onCleanUp hook'),
    onComplete: () => console.log('afterLaunch hook'),
    outputDir: "/path/to/log/dir",

    jasmineOpts: {
        showColors: true
    },

    protocol: "https",
    port: 443,
    hostname: "api.kobiton.com"
};
