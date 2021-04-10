exports.config = {
    protocol: "https",
    hostname: "ondemand.saucelabs.com",
    port: 4444,
    path: "/wd/hub",

    capabilities: [{
        'browserName': 'chrome',

        "sauce:options": {
            name: "foobar"
        }
    }],

    specs: [
        'spec.js'
    ]
};
