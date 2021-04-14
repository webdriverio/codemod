const { format } = require('util')
const flattenDeep = require('lodash.flattendeep')

const {
    SUPPORTED_SELECTORS,
    ELEMENT_COMMANDS,
    UNSUPPORTED_COMMANDS,
    COMMANDS_TO_REMOVE,
    UNSUPPORTED_COMMAND_ERROR,
    INCOMPATIBLE_COMMAND_ERROR
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
     * remove command statements that aren't useful in WebdriverIO world
     */
    root.find(j.ExpressionStatement)
        .filter((path) => (
            path.value.expression.callee &&
            path.value.expression.callee.property &&
            COMMANDS_TO_REMOVE.includes(path.value.expression.callee.property.name)
        ))
        .replaceWith((path) => null)

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
            path.value.callee.object.name === 'element' &&
            path.value.callee.property.name === 'all' &&
            matchesSelectorExpression(path)
        ))
        .replaceWith((path) => {
            const isCustomStrategy = !SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
            if (isCustomStrategy) {
                return j.callExpression(
                j.memberExpression(
                    j.identifier('browser'),
                    j.identifier('custom$$')
                ),
                getSelectorArgument(j, path, path.value.arguments[0], file)
                )
            }
            return j.callExpression(
                j.identifier('$$'),
                getSelectorArgument(j, path, path.value.arguments[0], file)
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
            }

            if (method === 'getProcessedConfig') {
                return j.memberExpression(
                    path.value.callee.object,
                    j.identifier('config')
                )
            }

            if (['findElement', 'findElements'].includes(method)) {
                return j.callExpression(
                    j.memberExpression(
                        path.value.callee.object,
                        j.identifier(method === 'findElement' ? '$' : '$$')
                    ),
                    getSelectorArgument(j, path, path.value.arguments[0], file)
                )
            }

            return j.callExpression(
                j.memberExpression(
                    path.value.callee.object,
                    j.identifier(replaceCommands(method))
                ),
                path.value.arguments
            )
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
            } else if (UNSUPPORTED_COMMANDS.includes(command)) {
                throw new TransformError(format(
                    UNSUPPORTED_COMMAND_ERROR,
                    command,
                    'https://github.com/webdriverio/codemod/issues/new'
                ), path.value.callee.property, file)
            }

            if (command === 'getWebElement') {
                return path.value.callee.object
            }

            /**
             * transform `element(by.css('#abc')).isElementPresent(by.css('#def'))`
             * to `$('#abc').$('#def')`
             */
            if (command === 'isElementPresent') {
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
            path.value.property.name === 'frame' &&
            path.value.object.callee &&
            path.value.object.callee.property.name === 'switchTo'
        ))
        .replaceWith((path) => j.memberExpression(
            j.identifier('browser'),
            j.identifier('switchToFrame')
        ))

    /**
     * no support for ExpectedConditions
     */
    root.find(j.MemberExpression)
        .filter((path) => (
            path.value.object.name === 'protractor' &&
            path.value.property.name === 'ExpectedConditions'
        ))
        .replaceWith((path) => {
            throw new TransformError('' +
                'WebdriverIO does not support ExpectedConditions. ' +
                'We advise to use `browser.waitUntil(...)` to wait ' +
                'for certain events to take place. For more information ' +
                'on this, see https://webdriver.io/docs/api/browser/waitUntil.',
                path.value,
                file
            )
        })

    return root.toSource();
}
