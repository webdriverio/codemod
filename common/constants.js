exports.OBSOLETE_REQUIRE_MODULES = [
    '@babel/register',
    'babel-register',
    'ts-node/register',
    'tsconfig-paths/register'
]

exports.COMPILER_OPTS_MAPPING = {
    '@babel/register': 'babelOpts',
    'babel-register': 'babelOpts',
    'ts-node/register': 'tsNodeOpts',
    'tsconfig-paths/register': 'tsConfigPathsOpts'
}

exports.ELEMENT_COMMANDS = [
    '$$',
    '$',
    'addValue',
    'clearValue',
    'click',
    'custom$$',
    'custom$',
    'doubleClick',
    'dragAndDrop',
    'getAttribute',
    'getCSSProperty',
    'getComputedRole',
    'getComputedLabel',
    'getHTML',
    'getLocation',
    'getProperty',
    'getSize',
    'getTagName',
    'getText',
    'getValue',
    'isClickable',
    'isDisplayed',
    'isDisplayedInViewport',
    'isEnabled',
    'isEqual',
    'isExisting',
    'isFocused',
    'isSelected',
    'moveTo',
    'nextElement',
    'parentElement',
    'previousElement',
    'react$$',
    'react$',
    'saveScreenshot',
    'scrollIntoView',
    'selectByAttribute',
    'selectByIndex',
    'selectByVisibleText',
    'setValue',
    'shadow$$',
    'shadow$',
    'touchAction',
    'waitForClickable',
    'waitForDisplayed',
    'waitForEnabled',
    'waitForExist',
    'waitUntil',
]
