// Tests for the calculator.
exports.config = {
    seleniumAddress: 'https://ondemand.saucelabs.com/wd/hub',
    capabilities: {
        'browserName': 'chrome',
        name: 'foobar',
        seleniumAddress: 'http://localhost:4444/wd/hub'
    },
    specs: [
        'spec.js'
    ]
};
