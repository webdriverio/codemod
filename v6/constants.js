const WAITFOR_PARAMS = [
    'timeout',
    'reverse',
    'timeoutMsg',
    'interval'
]

exports.COMMAND_TRANSFORMS = {
    newWindow: [
        'windowName',
        'windowFeature'
    ],
    react$: [
        'props',
        'state'
    ],
    react$$: [
        'props',
        'state'
    ],
    waitUntil: [
        'timeout',
        'timeoutMsg',
        'interval'
    ],
    dragAndDrop: [
        'duration'
    ],
    moveTo: [
        'xOffset',
        'yOffset'
    ],
    waitForDisplayed: WAITFOR_PARAMS,
    waitForEnabled: WAITFOR_PARAMS,
    waitForExist: WAITFOR_PARAMS
}

exports.COMMANDS_WITHOUT_FIRST_PARAM = [
    'moveTo', 'waitForDisplayed', 'waitForEnabled', 'waitForExist'
]

exports.SERVICE_PROPS = {
    browserstack: ['browserstackLocal', 'browserstackLocalForcedStop', 'browserstackOpts'],
    sauce: ['sauceConnect', 'sauceConnectOpts'],
    crossbrowsertesting: ['cbtTunnel', 'cbtTunnelOpts'],
    testingbot: ['tbTunnel', 'tbTunnelOpts'],
    'selenium-standalone': ['seleniumLogs', 'seleniumInstallArgs', 'seleniumArgs'],
    'static-server': ['staticServerFolders', 'staticServerPort', 'staticServerMiddleware']
}

exports.SERVICE_PROP_MAPPING = {
    browserstack: {
        browserstackLocalForcedStop: 'forcedStop',
        browserstackOpts: 'opts'
    },
    'selenium-standalone': {
        seleniumLogs: 'logPath',
        seleniumInstallArgs: 'installArgs',
        seleniumArgs: 'args'
    },
    'static-server': {
        staticServerFolders: 'folders',
        staticServerPort: 'port',
        staticServerMiddleware: 'middleware'
    }
}
