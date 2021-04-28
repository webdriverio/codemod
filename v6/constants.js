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
