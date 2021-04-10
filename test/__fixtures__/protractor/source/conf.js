// Tests for the calculator.
exports.config = {
    seleniumAddress: 'https://ondemand.saucelabs.com:4444/wd/hub',
    capabilities: {
        'browserName': 'chrome',
        name: 'foobar'
    },
    specs: [
        'spec.js'
    ]
};
