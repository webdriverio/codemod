const { SUPPORTED_SELECTORS, ELEMENT_COMMANDS } = require('./constants')
const {
    isCustomStrategy,
    TransformError,
    getSelectorArgument,
    matchesSelectorExpression,
    replaceCommands
} = require('./utils')

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

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
        .replaceWith((path) => j.callExpression(
            j.memberExpression(
                path.value.callee.object,
                j.identifier(replaceCommands(path.value.callee.property.name))
            ),
            path.value.arguments
        ))

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
            /**
             * transform `element(by.css('#abc')).isElementPresent(by.css('#def'))`
             * to `$('#abc').$('#def')`
             */
            if (path.value.callee.property.name === 'isElementPresent') {
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
                j.identifier(replaceCommands(path.value.callee.property.name))
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
            ['element', 'elements'].includes(path.value.callee.property.name)
        ))
        .replaceWith((path) => {
            const isCustomStrategy = !SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
            const chainedCommand = path.value.callee.property.name === 'element'
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

    return root.toSource();
}
