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
        path: "/wd/hub"
    }],

    specs: [
        'spec.js'
    ]
};
