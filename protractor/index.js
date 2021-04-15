const { format } = require('util')
const camelCase = require('camelcase')
const flattenDeep = require('lodash.flattendeep')

const {
    SUPPORTED_SELECTORS,
    ELEMENT_COMMANDS,
    UNSUPPORTED_COMMANDS,
    COMMANDS_TO_REMOVE,
    UNSUPPORTED_COMMAND_ADVICE,
    UNSUPPORTED_COMMAND_ERROR,
    INCOMPATIBLE_COMMAND_ERROR,
    REPLACE_WINDOW_COMMANDS,
    REPLACE_TIMEOUTS
} = require('./constants')
const {
    isCustomStrategy,
    TransformError,
    getSelectorArgument,
    matchesSelectorExpression,
    replaceCommands,
    parseConfigProperties
} = require('./utils')

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    j.file = file

    /**
     * transform Protractors config file
     * ```js
     * exports.config = {
     *   // ...
     * }
     * ```
     */
    root.find(j.ExpressionStatement)
        .filter((path) => (
            path.value.expression.type === 'AssignmentExpression' &&
            path.value.expression.left.object.name === 'exports' &&
            path.value.expression.left.property.name === 'config' &&
            path.value.expression.right.type === 'ObjectExpression'
        ))
        .replaceWith((path) => {
            const props = path.value.expression.right.properties
            let hasKobitonUserProp = props.find(({ key }) => (key.name || key.value) === 'kobitonUser')
            let hasKobitonKeyProp = props.find(({ key }) => (key.name || key.value) === 'kobitonKey')
            const kobitonConnectionOptions = hasKobitonUserProp && hasKobitonKeyProp
                ? [
                    j.objectProperty(
                        j.identifier('protocol'),
                        j.literal('https')
                    ),
                    j.objectProperty(
                        j.identifier('port'),
                        j.identifier('443')
                    ),
                    j.objectProperty(
                        j.identifier('hostname'),
                        j.literal('api.kobiton.com')
                    )
                ]
                : []
            return (
                j.expressionStatement(
                    j.assignmentExpression(
                        '=',
                        path.value.expression.left,
                        j.objectExpression(
                            flattenDeep(
                                props
                                    .map(parseConfigProperties.bind(j))
                                    .filter(Boolean)
                                    .concat(kobitonConnectionOptions)
                            )
                        )
                    )
                )
            )
        })

    /**
     * remove all protractor import declarations
     */
    root.find(j.ImportDeclaration)
        .filter((path) => path.value.source.value === 'protractor')
        .remove()
    root.find(j.VariableDeclaration)
        .filter((path) => (
            path.value.declarations.length &&
            path.value.declarations[0].init &&
            path.value.declarations[0].init.arguments &&
            path.value.declarations[0].init.arguments[0] &&
            path.value.declarations[0].init.arguments[0].value === 'protractor'
        ))
        .remove()

    /**
     * remove all `require('ts-node')` and `jasmine.getEnv()`
     */
    root.find(j.ExpressionStatement)
        .filter((path) => {
            if (
                !path.value.expression.callee ||
                !path.value.expression.callee.object
            ) {
                return false
            }
            const expr = path.value.expression.callee.object
            return (
                (
                    expr.callee && expr.callee.name === 'require' &&
                    expr.arguments && expr.arguments[0].value === 'ts-node'
                ) ||
                (
                    expr.callee &&
                    expr.callee.object &&
                    expr.callee.object.name === 'jasmine' &&
                    expr.callee.property.name === 'getEnv'
                )
            )
        })
        .remove()


    /**
     * remove command statements that aren't useful in WebdriverIO world
     */
    root.find(j.ExpressionStatement)
        .filter((path) => {
            const expr = (
                path.value.expression.callee ||
                (
                    path.value.expression.argument &&
                    path.value.expression.argument.callee
                )
            )
            return (expr && expr.property && COMMANDS_TO_REMOVE.includes(expr.property.name))
        })
        .remove()

    /**
     * remove unsupported assignments like
     * browser.ignoreSynchronization = true;
     */
    root.find(j.ExpressionStatement)
        .filter((path) => (
            path.value.expression.left &&
            path.value.expression.left.object &&
            path.value.expression.left.object.name === 'browser' &&
            path.value.expression.left.property.name === 'ignoreSynchronization'
        ))
        .remove()

    /**
     * transform_
     * browser.driver.findElement
     * browser.findElement
     */
    root.find(j.MemberExpression)
        .filter((path) => (
            path.value.object.name === 'browser' &&
            path.value.property.name === 'driver'
        ))
        .replaceWith((path) => j.identifier('browser'))

    /**
     * transform:
     * element(...)
     * $('...')
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'Identifier' &&
            path.value.callee.name === 'element' &&
            matchesSelectorExpression(path)
        ))
        .replaceWith((path) => {
            const isCustomStrategy = !SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
            if (isCustomStrategy) {
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier('custom$')
                    ),
                    getSelectorArgument(j, path, path.value.arguments[0], file)
                )
            }

            return j.callExpression(
                j.identifier('$'),
                getSelectorArgument(j, path, path.value.arguments[0], file)
            )
        })

    /**
     * transform:
     * element.all(...)
     * $$('...')
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'MemberExpression' &&
            path.value.callee.property.name === 'all' &&
            matchesSelectorExpression(path)
        ))
        .replaceWith((path) => {
            const scope = path.value.callee.object
            const isCustomStrategy = !SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
            const hasCustomScope = scope.name !== 'element'
            if (isCustomStrategy) {
                return j.callExpression(
                    hasCustomScope
                        ? scope
                        : j.memberExpression(
                            j.identifier('browser'),
                            j.identifier('custom$$')
                        ),
                    getSelectorArgument(j, path, path.value.arguments[0], file)
                )
            }
            return j.callExpression(
                hasCustomScope
                    ? j.memberExpression(
                        scope,
                        j.identifier('$$')
                    )
                    : j.identifier('$$'),
                getSelectorArgument(j, path, path.value.arguments[0], file)
            )
        })

    /**
     * transform:
     * element.all(...).get(0)
     * $$('...')[0]
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee.object &&
            path.value.callee.object.callee &&
            path.value.callee.object.callee.name === '$$' &&
            path.value.callee.property.name === 'get'
        ))
        .replaceWith((path) => j.memberExpression(
            path.value.callee.object,
            path.value.arguments[0]
        ))

    /**
     * transform
     * browser.actions().sendKeys(protractor.Key.ENTER).perform();
     * browser.keys('Enter')
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.object &&
            path.value.callee.object.callee &&
            path.value.callee.object.callee.object &&
            path.value.callee.object.callee.object.callee &&
            path.value.callee.object.callee.object.callee.property &&
            path.value.callee.object.callee.object.callee.property.name === 'actions' &&
            path.value.callee.object.callee.property.name === 'sendKeys'
        ))
        .replaceWith((path) => {
            const param = path.value.callee.object.arguments[0]
            if (!param.object.object || param.object.object.name !== 'protractor' || param.object.property.name !== 'Key') {
                throw new TransformError('' +
                    'Expected "proctractor.Key.XXX" as argument to the sendKeys command. ' +
                    'Please raise an issue in the codemod repository: https://github.com/webdriverio/codemod/issues/new',
                    path.value,
                    file
                )
            }

            const key = param.property.name.slice(0, 1).toUpperCase() + camelCase(param.property.name).slice(1)
            return j.callExpression(
                j.memberExpression(
                    j.identifier('browser'),
                    j.identifier('keys')
                ),
                [
                    j.literal(key)
                ]
            )
        })

    /**
     * transform browser commands
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'MemberExpression' &&
            path.value.callee.object.name === 'browser'
        ))
        .replaceWith((path) => {
            const method = path.value.callee.property.name
            let args = path.value.arguments

            /**
             * throw error for methods that can't be transformed
             */
            if (method === 'touchActions') {
                throw new TransformError(
                    format(INCOMPATIBLE_COMMAND_ERROR, method, 'https://webdriver.io/docs/api/browser/touchAction'),
                    path.value,
                    file
                )
            } else if (method === 'actions') {
                throw new TransformError(
                    format(INCOMPATIBLE_COMMAND_ERROR, method, 'https://webdriver.io/docs/api/webdriver#performactions'),
                    path.value,
                    file
                )
            } else if (method === 'setLocation') {
                throw new TransformError(
                    format(INCOMPATIBLE_COMMAND_ERROR, method, 'https://webdriver.io/docs/api/browser/url'),
                    path.value,
                    file
                )
            } else if (UNSUPPORTED_COMMANDS.includes(method)) {
                throw new TransformError(
                    format(UNSUPPORTED_COMMAND_ERROR, method, 'https://github.com/webdriverio/codemod/issues/new'),
                    path.value.callee.property,
                    file
                )
            } else if (method === 'getProcessedConfig') {
                return j.memberExpression(
                    path.value.callee.object,
                    j.identifier('config')
                )
            } else if (['findElement', 'findElements'].includes(method)) {
                return j.callExpression(
                    j.memberExpression(
                        path.value.callee.object,
                        j.identifier(method === 'findElement' ? '$' : '$$')
                    ),
                    getSelectorArgument(j, path, args[0], file)
                )
            } else if (method === 'get') {
                args = path.value.arguments.slice(0, 1)
            } else if (method === 'wait' && args.length > 1) {
                return j.callExpression(
                    j.memberExpression(
                        path.value.callee.object,
                        j.identifier(replaceCommands(method))
                    ),
                    [
                        args[0],
                        j.objectExpression([
                            ...(args[1]
                                ? [
                                    j.objectProperty(
                                        j.identifier('timeout'),
                                        args[1]
                                    )
                                ]
                                : []
                            ),
                            ...(args[2]
                                ? [
                                    j.objectProperty(
                                        j.identifier('timeoutMsg'),
                                        args[2]
                                    )
                                ]
                                : []
                            )
                        ])
                    ]
                )
            }

            return j.callExpression(
                j.memberExpression(
                    path.value.callee.object,
                    j.identifier(replaceCommands(method))
                ),
                args
            )
        })

    /**
     * transform
     * - `browser.manage().logs().get(...)`
     * - `browser.driver.manage().timeouts().implicitlyWait(15000);`
     * - `browser.driver.manage().window().maximize();`
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.property &&
            ['get', ...Object.keys(REPLACE_TIMEOUTS), ...Object.keys(REPLACE_WINDOW_COMMANDS)].includes(path.value.callee.property.name) &&
            path.value.callee.object &&
            path.value.callee.object.callee &&
            path.value.callee.object.callee.property &&
            ['logs', 'timeouts', 'window'].includes(path.value.callee.object.callee.property.name)
        ))
        .replaceWith((path) => {
            const scope = path.value.callee.object.callee.property.name
            const command = path.value.callee.property.name

            if (scope === 'logs') {
                let logType = path.value.arguments[0].property.name.toLowerCase()
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier('getLogs')
                    ),
                    [
                        j.literal(logType)
                    ]
                )
            } else if (scope === 'timeouts') {
                const timeout = path.value.arguments[0].value
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier('setTimeout')
                    ),
                    [
                        j.objectExpression([
                            j.objectProperty(
                                j.identifier(REPLACE_TIMEOUTS[command]),
                                j.literal(timeout)
                            )
                        ])
                    ]
                )
            } else if (scope === 'window') {
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier(REPLACE_WINDOW_COMMANDS[command])
                    ),
                    []
                )
            }

        })

    /**
     * transform element commands
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'MemberExpression' &&
            ELEMENT_COMMANDS.includes(path.value.callee.property.name)
        ))
        .replaceWith((path) => {
            const command = path.value.callee.property.name

            if (command === 'getCssValue') {
                throw new TransformError(
                    format(INCOMPATIBLE_COMMAND_ERROR, command, 'https://webdriver.io/docs/api/element/getCSSProperty/'),
                    path.value.callee.property,
                    file
                )
            } else if (command === 'submit') {
                throw new TransformError(
                    format(
                        UNSUPPORTED_COMMAND_ADVICE,
                        command,
                        'use the click command to click on the submit button',
                        'https://webdriver.io/docs/api/element/click'
                    ),
                    path.value,
                    file
                )
            } else if (UNSUPPORTED_COMMANDS.includes(command)) {
                throw new TransformError(format(
                    UNSUPPORTED_COMMAND_ERROR,
                    command,
                    'https://github.com/webdriverio/codemod/issues/new'
                ), path.value.callee.property, file)
            } else if (command === 'getWebElement') {
                return path.value.callee.object
            } else if (command === 'getId') {
                return j.memberExpression(
                    path.value.callee.object,
                    j.identifier('elementId')
                )
            } else if (command === 'isElementPresent') {
                /**
                 * transform `element(by.css('#abc')).isElementPresent(by.css('#def'))`
                 * to `$('#abc').$('#def')`
                 */
                return j.callExpression(
                    j.memberExpression(
                        j.callExpression(
                            j.memberExpression(
                                path.value.callee.object,
                                j.identifier('$')
                            ),
                            getSelectorArgument(j, path, path.value.arguments[0], file)
                        ),
                        j.identifier('isExisting')
                    ),
                    []
                )
            } else if (command === 'count') {
                return j.memberExpression(
                    path.value.callee.object,
                    j.identifier('length')
                )
            } else if (
                /**
                 * check if element was called with get, e.g.
                 * this.deleteButtons.get(0).click();
                 */
                path.value.callee.object.callee &&
                path.value.callee.object.callee.property &&
                path.value.callee.object.callee.property.name === 'get'
            ) {
                return j.callExpression(
                    j.memberExpression(
                        j.memberExpression(
                            path.value.callee.object.callee.object,
                            path.value.callee.object.arguments[0]
                        ),
                        j.identifier(replaceCommands(command))
                    ),
                    path.value.arguments
                )
            }

            /**
             * transform any other element command
             */
            return j.callExpression(
                j.memberExpression(
                    path.value.callee.object,
                    j.identifier(replaceCommands(command))
                ),
                path.value.arguments
            )
        })

    /**
     * transform element chaining
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'MemberExpression' &&
            ['element', 'elements', 'findElement', 'findElements'].includes(path.value.callee.property.name)
        ))
        .replaceWith((path) => {
            const isCustomStrategy = !SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
            const singleElementCall = ['element', 'findElement']
            const chainedCommand = singleElementCall.includes(path.value.callee.property.name)
                ? isCustomStrategy ? 'custom$' : '$'
                : isCustomStrategy ? 'custom$$' : '$$'
            return j.callExpression(
                j.memberExpression(
                    path.value.callee.object,
                    j.identifier(chainedCommand)
                ),
                getSelectorArgument(j, path, path.value.arguments[0], file)
            )
        })

    /**
     * replace await/then calls, e.g.
     * ```
     * await browser.getAllWindowHandles().then(handles => {
     *   browser.switchTo().window(handles[handles.length - 1]);
     * })
     * ```
     * to:
     * ```
     * const handles = await browser.getAllWindowHandles()
     * browser.switchTo().window(handles[handles.length - 1]);
     * ```
     */
    root.find(j.ExpressionStatement)
        .filter((path) => (
            path.value.expression &&
            path.value.expression.type === 'AwaitExpression' &&
            path.value.expression.argument.type === 'CallExpression' &&
            path.value.expression.argument.callee.property.name === 'then'
        ))
        .replaceWith((path) => {
            return [
                j.variableDeclaration(
                'let',
                [
                    j.variableDeclarator(
                        j.identifier(path.value.expression.argument.arguments[0].params[0].name),
                        j.awaitExpression(path.value.expression.argument.callee.object)
                    )
                ]
                ),
                ...path.value.expression.argument.arguments[0].body.body
            ]
        })

    /**
     * transform by.addLocator
     */
    root.find(j.CallExpression)
        .filter((path) => (
            path.value.callee &&
            path.value.callee.type === 'MemberExpression' &&
            path.value.callee.object.name === 'by' &&
            path.value.callee.property.name === 'addLocator'
        ))
        .replaceWith((path) => {
            /**
             * check if user uses rootSelector parameter which is not supported
             * in WebdriverIO
             */
            if (path.value.arguments[1].params.length > 2) {
                const errorText = '' +
                    `WebdriverIO doesn't support the "rootSelector" ` +
                    `parameter in the custom locator function.`
                throw new TransformError(errorText, path, file)
            }

            return j.callExpression(
                j.memberExpression(
                    j.identifier('browser'),
                    j.identifier('addLocatorStrategy')
                ),
                path.value.arguments
            )
        })

    /**
     * transform `browser.switchTo().frame('composeWidget');`
     */
    root.find(j.MemberExpression)
        .filter((path) => (
            ['frame', 'window'].includes(path.value.property.name) &&
            path.value.object.callee &&
            path.value.object.callee.property.name === 'switchTo'
        ))
        .replaceWith((path) => j.memberExpression(
            j.identifier('browser'),
            j.identifier(replaceCommands(path.value.property.name))
        ))

    /**
     * no support for ExpectedConditions
     */
    root.find(j.MemberExpression)
        .filter((path) => path.value.object.name === 'protractor')
        .replaceWith((path) => {
            if (path.value.property.name === 'ExpectedConditions') {
                throw new TransformError('' +
                    'WebdriverIO does not support ExpectedConditions. ' +
                    'We advise to use `browser.waitUntil(...)` to wait ' +
                    'for certain events to take place. For more information ' +
                    'on this, see https://webdriver.io/docs/api/browser/waitUntil.',
                    path.value,
                    file
                )
            }

            throw new TransformError('' +
                `"${path.value.object.name}.${path.value.property.name}" ` +
                'is unknown to this codemod. If this kind of code appears ' +
                'often in your code base, please raise an issue in the codemod ' +
                'repository: https://github.com/webdriverio/codemod/issues/new.',
                path.value,
                file
            )
        })

    return root.toSource();
}
