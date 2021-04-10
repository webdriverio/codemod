exports.SUPPORTED_SELECTORS = ['id', 'model', 'css', 'binding', 'cssContainingText']
exports.ELEMENT_COMMANDS = ['sendKeys', 'isPresent', 'isElementPresent', 'getWebElement']
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
    'controlFlowIsEnabled'
]
