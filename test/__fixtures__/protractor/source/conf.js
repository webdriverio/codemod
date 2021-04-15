// Tests for the calculator.
exports.config = {
    seleniumAddress: 'https://ondemand.saucelabs.com/wd/hub',
    capabilities: {
        'browserName': 'chrome',
        name: 'foobar',
        seleniumAddress: 'http://localhost:4444/wd/hub',
        maxInstances: 123,
        shardTestFiles: true,
        chromeOptions: {
            args: ['foobar']
        },
        firefoxOptions: {
            args: ['foobar']
        }
    },
    multiCapabilities: [{
        'browserName': 'chrome',
        seleniumAddress: 'http://localhost:4444/wd/hub',
        maxInstances: 123,
        shardTestFiles: true
    }],
    specs: [
        'spec.js'
    ],

    framework: 'jasmine2',
    framework: 'jasmine',
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
    onPrepare: () => {
        console.log('onPrepare hook')
        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.e2e.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));

        browser.driver.manage().timeouts().implicitlyWait(15000);
        browser.driver.manage().timeouts().pageLoadTimeout(15000);
        browser.driver.manage().timeouts().setScriptTimeout(15000);
        browser.driver.manage().window().maximize();
        browser.driver.manage().window().minimize();
        browser.driver.manage().window().fullscreen();
        browser.ignoreSynchronization = true;
    },
    onComplete: () => console.log('onComplete hook'),
    onCleanUp: () => console.log('onCleanUp hook'),
    afterLaunch: () => console.log('afterLaunch hook'),
    webDriverLogDir: "/path/to/log/dir",
    jasmineNodeOpts: {
        showColors: true
    }
};
