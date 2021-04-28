exports.config = {
    services: [["sauce", {
        sauceConnect: true,
        sauceConnectOpts: { foo: 'bar' }
    }], ["appium", {
        command: "appium",
        logPath : "./",
        args: {
            debugLogSpacing: true,
            platformName: 'iOS',
        }
    }], ["applitools", {
        key: '<APPLITOOLS_KEY>', // can be passed here or via environment variable `APPLITOOLS_KEY`
        serverUrl: 'https://<org>eyesapi.applitools.com', // optional, can be passed here or via environment variable `APPLITOOLS_SERVER_URL`
        // options
        proxy: { // optional
            url: 'http://corporateproxy.com:8080',
            username: 'username', // optional
            password: 'secret', // optional
            isHttpOnly: true, // optional
        },
        viewport: { // optional
            width: 1920,
            height: 1080
        }
    }], ["browserstack", {
        browserstackLocal: true,
        forcedStop: true,
        opts: {}
    }], ["crossbrowsertesting", {
        cbtTunnel: true,

        cbtTunnelOpts: {
            bar: 'foo'
        }
    }], ["firefox-profile", {
        extensions: [
            '/path/to/extensionA.xpi', // path to .xpi file
            '/path/to/extensionB' // or path to unpacked Firefox extension
        ],
        'xpinstall.signatures.required': false,
        'browser.startup.homepage': 'https://webdriver.io',
        legacy: true // used for firefox <= 55
    }], ["selenium-standalone", {
        logPath: 'logs',

        installArgs: {
            drivers: {
                chrome: { version: '77.0.3865.40' },
                firefox: { version: '0.25.0' },
            }
        },

        args: {
            drivers: {
                chrome: { version: '77.0.3865.40' },
                firefox: { version: '0.25.0' },
            }
        }
    }], ["static-server", {
        folders: [
            { mount: '/fixtures', path: './tests/fixtures' },
            { mount: '/dist', path: './dist' },
        ],

        port: 1234,

        middleware: [{
            mount: '/',
            middleware: middleware(/* middleware options */),
        }]
    }], ["testingbot", {
        tbTunnel: true,

        tbTunnelOpts: {
            foo: 'bar'
        }
    }]],

    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us'
};
