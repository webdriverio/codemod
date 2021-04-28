exports.config = {
    services: ['sauce', 'appium', 'applitools', 'browserstack', 'crossbrowsertesting', 'firefox-profile', 'selenium-standalone', 'static-server', 'testingbot'],
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us',
    sauceConnect: true,
    sauceConnectOpts: { foo: 'bar' },
    browserstackLocal: true,
    browserstackLocalForcedStop: true,
    browserstackOpts: {},
    appium: {
        command: "appium",
        logPath : "./",
        args: {
            debugLogSpacing: true,
            platformName: 'iOS',
        }
    },
    applitools: {
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
    },
    cbtTunnel: true,
    cbtTunnelOpts: {
        bar: 'foo'
    },
    tbTunnel: true,
    tbTunnelOpts: {
        foo: 'bar'
    },
    firefoxProfile: {
        extensions: [
            '/path/to/extensionA.xpi', // path to .xpi file
            '/path/to/extensionB' // or path to unpacked Firefox extension
        ],
        'xpinstall.signatures.required': false,
        'browser.startup.homepage': 'https://webdriver.io',
        legacy: true // used for firefox <= 55
    },
    seleniumLogs: 'logs',
    seleniumInstallArgs: {
        drivers: {
            chrome: { version: '77.0.3865.40' },
            firefox: { version: '0.25.0' },
        }
    },
    seleniumArgs: {
        drivers: {
            chrome: { version: '77.0.3865.40' },
            firefox: { version: '0.25.0' },
        }
    },
    staticServerFolders: [
        { mount: '/fixtures', path: './tests/fixtures' },
        { mount: '/dist', path: './dist' },
    ],
    staticServerPort: 1234,
    staticServerMiddleware: [{
        mount: '/',
        middleware: middleware(/* middleware options */),
    }]
};
