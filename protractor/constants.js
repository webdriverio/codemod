const { format } = require('util')

const UNSUPPORTED_SELECTOR_STRATEGY_ERROR = 'The selector "%s" is not supported, please consider refactor this line.'
exports.UNSUPPORTED_SELECTOR_STRATEGIES = {
    binding: format(UNSUPPORTED_SELECTOR_STRATEGY_ERROR, 'by.binding'),
    deepCss: 'WebdriverIO does not natively support deep CSS queries yet (https://github.com/webdriverio/webdriverio/issues/6709). We advise to use this plugin: https://github.com/Georgegriff/query-selector-shadow-dom.',
    exactRepeater: format(UNSUPPORTED_SELECTOR_STRATEGY_ERROR, 'by.exactRepeater'),
    exactBinding: format(UNSUPPORTED_SELECTOR_STRATEGY_ERROR, 'by.exactBinding')
}

exports.SUPPORTED_SELECTORS = [
    ...Object.keys(exports.UNSUPPORTED_SELECTOR_STRATEGIES),
    'id',
    'model',
    'css',
    'className',
    'cssContainingText',
    'xpath',
    'tagName',
    'repeater',
    'partialLinkText',
    'name',
    'js',
    'linkText',
    'options',
    'buttonText',
    'partialButtonText'
]

exports.ELEMENT_COMMANDS = [
    'sendKeys',
    'isPresent',
    'isElementPresent',
    'getWebElement',
    'evaluate',
    'getDriver',
    'getCssValue',
    'clear',
    'submit',
    'getId',
    'clone',
    'column',
    'count',
    'click',
    'getTagName',
    'getAttribute',
    'getText',
    'getSize',
    'getLocation',
    'isEnabled',
    'isSelected',
    'isDisplayed',
    'takeScreenshot',
    'getPosition',
    'setSize'
]
exports.COMMANDS_TO_REMOVE = ['allowAnimations']
exports.UNSUPPORTED_COMMANDS = [
    'angularAppRoot',
    'waitForAngularEnabled',
    'forkNewDriverInstance',
    'useAllAngular2AppRoots',
    'waitForAngular',
    'addMockModule',
    'clearMockModules',
    'removeMockModule',
    'getRegisteredMockModules',
    'controlFlowIsEnabled',
    'evaluate',
    'clone',
    'column'
]

exports.UNSUPPORTED_COMMAND_ERROR = '' +
    'The command "%s" has no replacement implementation in WebdriverIO. ' +
    'It might be depcrecated and can be removed entirely. ' +
    'If this method is essential for your e2e test scenarios though, ' +
    'please file an issue in %s and the WebdriverIO team can follow up on this.'

exports.INCOMPATIBLE_COMMAND_ERROR = '' +
    'Can not transform "%s" command as it differs ' +
    'too much from the WebdriverIO implementation. We advise ' +
    'to refactor this code.\n\n' +
    'For more information on WebdriverIOs replacement command, see %s'

exports.UNSUPPORTED_COMMAND_ADVICE = '' +
'The command "%s" is not supported in WebdriverIO. We advise to ' +
'%s instead. For more information on this configuration, see %s.'

exports.IGNORED_CONFIG_PROPERTIES = [
    'seleniumServerStartTimeout',
    'seleniumSessionId',
    'webDriverProxy',
    'useBlockingProxy',
    'blockingProxyUrl',
    'sauceAgent',
    'sauceSeleniumUseHttp',
    'sauceSeleniumAddress',
    'browserstackProxy',
    'directConnect',
    'seleniumWebDriver',
    'noGlobals',
    'getMultiCapabilities',
    'verboseMultiSessions',
    'rootElement',
    'restartBrowserBetweenTests',
    'untrackOutstandingTimeouts',
    'ignoreUncaughtExceptions',
    'highlightDelay',
    'skipSourceMapSupport',
    'disableEnvironmentOverrides',
    'ng12Hybrid',
    'disableChecks',
    'SELENIUM_PROMISE_MANAGER',
    'seleniumArgs',
    'jvmArgs',
    'configDir',
    'troubleshoot',
    'seleniumPort',
    'mockSelenium',
    'v8Debug',
    'nodeDebug',
    'debuggerServerPort',
    'frameworkPath',
    'elementExplorer',
    'debug',
    'unknownFlags_'
]

exports.IGNORED_CAPABILITIES = [
    'count',
    'shardTestFiles'
]

exports.REPLACE_CONFIG_KEYS = {
    sauceUser: 'user',
    testobjectUser: 'user',
    browserstackUser: 'user',
    kobitonUser: 'user',
    sauceKey: 'key',
    testobjectKey: 'key',
    browserstackKey: 'key',
    kobitonKey: 'key',
    sauceRegion: 'region',
    maxSessions: 'maxInstances',
    beforeLaunch: 'onPrepare',
    onPrepare: 'before',
    onComplete: 'after',
    onCleanUp: 'afterSession',
    afterLaunch: 'onComplete',
    webDriverLogDir: 'outputDir',
    jasmineNodeOpts: 'jasmineOpts'
}

exports.REPLACE_TIMEOUTS = {
    implicitlyWait: 'implicit',
    pageLoadTimeout: 'pageLoad',
    setScriptTimeout: 'script'
}

exports.REPLACE_WINDOW_COMMANDS = {
    fullscreen: 'fullscreenWindow',
    maximize: 'maximizeWindow',
    minimize: 'minimizeWindow',
    getPosition: 'getWindowRect',
    setSize: 'setWindowRect',
    getSize: 'getWindowRect',
}

exports.REPLACE_MANAGE_COMMANDS = {
    deleteAllCookies: 'deleteCookies',
    deleteCookie: 'deleteCookie',
    addCookie: 'addCookie',
    getCookie: 'getCookie',
    getCookies: 'getCookies'
}

exports.REPLACE_NAVIGATE_COMMANDS = {
    forward: 'forward',
    back: 'back',
    refresh: 'refresh',
    to: 'url'
}

exports.UNSUPPORTED_CONFIG_OPTION_ERROR = '' +
    'The option "%s" is not supported in WebdriverIO. We advise to use ' +
    '%s instead. For more information on this configuration, see %s.'

exports.SELECTOR_COMMANDS = ['$', '$$']
