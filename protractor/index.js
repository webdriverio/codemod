const { format } = require('util')
const camelCase = require('camelcase')
const flattenDeep = require('lodash.flattendeep')
const compilers = require('../common/compilers')

const {
    SUPPORTED_SELECTORS,
    PRTRCTR_ELEMENT_COMMANDS,
    SELECTOR_COMMANDS,
    UNSUPPORTED_COMMANDS,
    COMMANDS_TO_REMOVE,
    UNSUPPORTED_COMMAND_ADVICE,
    UNSUPPORTED_COMMAND_ERROR,
    INCOMPATIBLE_COMMAND_ERROR,
    REPLACE_WINDOW_COMMANDS,
    REPLACE_TIMEOUTS,
    REPLACE_MANAGE_COMMANDS,
    REPLACE_NAVIGATE_COMMANDS
} = require('./constants')
const { ELEMENT_COMMANDS } = require('../common/constants')
const {
    isCustomStrategy,
    TransformError,
    getSelectorArgument,
    matchesSelectorExpression,
    replaceCommands,
    parseConfigProperties,
    sanitizeAsyncCalls,
    makeAsync
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
    root.find(j.ExpressionStatement, {
        expression: {
            type: 'AssignmentExpression',
            left: {
                object: { name: 'exports' },
                property: { name: 'config' }
            },
            right: {
                type: 'ObjectExpression'
            }
        }
    }).replaceWith((path) => {
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

    const autoCompileOpts = compilers.remove(j, root)

    /**
     * remove all protractor import declarations
     */
    root.find(j.ImportDeclaration, {
        source: { value: 'protractor' }
    }).remove()
    root.find(j.VariableDeclaration, {
        declarations: [{ init: { arguments: [{ value: 'protractor' }] } }]
    }).remove()

    /**
     * remove `require("babel-register")({ ... })`
     */
    root.find(j.ExpressionStatement, {
        expression: { callee: {
            callee: { name: 'require' },
            arguments: [{
                value: 'babel-register'
            }]
        } }
    }).remove()

    /**
     * remove all `jasmine.getEnv()`
     */
    root.find(j.ExpressionStatement, {
        expression: { callee: {
            object: {
                callee: { name: 'require' },
                arguments: [{ value: 'ts-node' }]
            },
            property: { name: 'register' }
        } }
    }).remove()

    /**
     * remove all `require('ts-node').register({ ... })`
     */
    root.find(j.ExpressionStatement, {
        expression: { callee: { object: { callee: {
            object: { name: 'jasmine' },
            property: { name: 'getEnv' }
        } } } }
    }).remove()

    /**
     * remove command statements that aren't useful in WebdriverIO world, e.g.
     * await $('body').allowAnimations(false);
     * browser.waitForAngularEnabled(true)
     */
    root.find(j.ExpressionStatement)
        .filter(({ value: { expression } }) => {
            const expr = (
                expression.callee ||
                (
                    expression.argument &&
                    expression.argument.callee
                )
            )
            return (expr && expr.property && COMMANDS_TO_REMOVE.includes(expr.property.name))
        })
        .remove()

    /**
     * remove unsupported assignments like
     * browser.ignoreSynchronization = true;
     */
    root.find(j.ExpressionStatement, {
        expression: { left: {
            object: { name: 'browser' },
            property: { name: 'ignoreSynchronization' }
        } }
    }).remove()

    /**
     * transform_
     * browser.driver.findElement
     * browser.findElement
     */
    root.find(j.MemberExpression, {
        object: { name: 'browser' },
        property: { name: 'driver' }
    }).replaceWith((path) => j.identifier('browser'))

    /**
     * transform:
     * element(...)
     * $('...')
     */
    root.find(j.CallExpression, { callee: { name: 'element' } })
        .filter((path) => matchesSelectorExpression(path))
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
    root.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            property: { name: 'all' }
        }
    })
    .filter((path) => matchesSelectorExpression(path))
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
     * $$('...').get(0)
     * $$('...')[0]
     */
    root.find(j.CallExpression, {
        callee: {
            object: { callee: { name: '$$' } },
            property: { name: 'get' }
        }
    })
    .replaceWith((path) => j.memberExpression(
        path.value.callee.object,
        path.value.arguments[0]
    ))

    /**
     * transform
     * browser.actions().sendKeys(protractor.Key.ENTER).perform();
     * browser.keys('Enter')
     */
    root.find(j.CallExpression, {
        callee: { object: { callee: {
            object: { callee: { property: { name: 'actions' } } },
            property: { name: 'sendKeys' }
        } } }
    }).replaceWith((path) => {
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
    root.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            object: { name: 'browser' }
        }
    }).replaceWith((path) => {
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
            path.value.callee.property &&
            [
                'get',
                 ...Object.keys(REPLACE_TIMEOUTS),
                 ...Object.keys(REPLACE_WINDOW_COMMANDS),
                 ...Object.keys(REPLACE_MANAGE_COMMANDS),
                 ...Object.keys(REPLACE_NAVIGATE_COMMANDS)
            ].includes(path.value.callee.property.name) &&
            path.value.callee.object &&
            path.value.callee.object.callee &&
            path.value.callee.object.callee.property &&
            ['logs', 'timeouts', 'window', 'manage', 'navigate'].includes(path.value.callee.object.callee.property.name)
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
                const args = []

                if (command === 'setSize') {
                    args.push(
                        j.literal(0),
                        j.literal(0),
                        path.value.arguments[0],
                        path.value.arguments[1]
                    )
                }

                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier(REPLACE_WINDOW_COMMANDS[command])
                    ),
                    args
                )
            } else if (scope === 'manage') {
                const args = []

                if (command === 'addCookie') {
                    args.push(path.value.arguments[0])
                } else if (command === 'deleteCookie' || command === 'getCookie') {
                    const cookieValue = path.value.arguments[0].value;

                    args.push(j.literal(cookieValue));
                }

                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier(REPLACE_MANAGE_COMMANDS[command])
                    ),
                    args
                )
            } else if (scope === 'navigate') {
                const args = [];

                if (command === 'to') {
                    const urlValue = path.value.arguments[0].value;

                    args.push(j.literal(urlValue));
                }
                return j.callExpression(
                    j.memberExpression(
                        j.identifier('browser'),
                        j.identifier(REPLACE_NAVIGATE_COMMANDS[command])
                    ),
                    args
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
            PRTRCTR_ELEMENT_COMMANDS.includes(path.value.callee.property.name)
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
            let object = path.value.callee.object
            if (
                path.value.callee.object.type === 'AwaitExpression' &&
                path.parentPath.value.type === 'AwaitExpression'
            ) {
                object = object.argument
            }
            return j.callExpression(
                j.memberExpression(
                    object,
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
    root.find(j.ExpressionStatement, {
        expression: {
            type: 'AwaitExpression',
            argument: {
                type: 'CallExpression',
                callee: { property: { name: 'then' } }
            }
        }
    }).replaceWith((path) => [
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
    ])

    /**
     * transform by.addLocator
     */
    root.find(j.CallExpression, {
        callee: {
            type: 'MemberExpression',
            object: { name: 'by' },
            property: { name: 'addLocator' }
        }
    }).replaceWith((path) => {
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
     * transform
     * - const EC = protractor.ExpectedConditions;
     * into
     * - const EC = require('wdio-wait-for')
     */
    const wdioWaitForImport = j.callExpression(
        j.identifier('require'),
        [
            j.literal('wdio-wait-for')
        ]
    )
    root.find(j.VariableDeclaration, {
        declarations: [{
            init: {
                object: { name: 'protractor' },
                property: { name: 'ExpectedConditions' }
            }
        }]
    }).replaceWith((path) => j.variableDeclaration(
        path.value.kind,
        [
            j.variableDeclarator(
                path.value.declarations[0].id,
                wdioWaitForImport
            )
        ]
    ))

    /**
     * transform expected conditions not put into a var
     */
    root.find(j.MemberExpression, {
        object: {
            object: { name: 'protractor' },
            property: { name: 'ExpectedConditions' }
        }
    }).replaceWith((path) => j.memberExpression(
        wdioWaitForImport,
        path.value.property
    ))

    /**
     * no support
     */
    root.find(j.MemberExpression, {
        object: { name: 'protractor' }
    }).replaceWith((path) => {
        throw new TransformError('' +
            `"${path.value.object.name}.${path.value.property.name}" ` +
            'is unknown to this codemod. If this kind of code appears ' +
            'often in your code base, please raise an issue in the codemod ' +
            'repository: https://github.com/webdriverio/codemod/issues/new.',
            path.value,
            file
        )
    })

    /**
     * transform element declarations in class constructors into getters
     */
    const elementGetters = new Map()
    root.find(j.MethodDefinition, { kind: 'constructor' }).replaceWith((path) => {
        const isElementDeclaration = (e) => (
            e.expression && e.expression.type === 'AssignmentExpression' &&
            e.expression.left.object && e.expression.left.object.type === 'ThisExpression' &&
            e.expression.left.property && e.expression.left.property.type === 'Identifier' &&
            (
                e.expression.right.callee && SELECTOR_COMMANDS.includes(e.expression.right.callee.name) ||
                e.expression.right.arguments && e.expression.right.arguments.find((arg) => arg.callee && SELECTOR_COMMANDS.includes(arg.callee.name))
            )
        )

        for (const e of path.value.value.body.body.filter(isElementDeclaration)) {
            elementGetters.set(e.expression.left.property, e.expression.right)
        }

        return [
            j.methodDefinition(
                path.value.kind,
                path.value.key,
                j.functionExpression(
                    path.value.value.id,
                    path.value.value.params,
                    j.blockStatement(path.value.value.body.body.filter((e) => !isElementDeclaration(e)))
                )
            ),
            ...[...elementGetters.entries()].map(([elemName, object]) => j.methodDefinition(
                'get',
                elemName,
                j.functionExpression(
                    null,
                    [],
                    j.blockStatement([
                        j.returnStatement(object)
                    ])
                )
            ))
        ]
    })

    /**
     * transform lazy loaded element calls in async context, e.g.
     * await friendPage.addnameBox.setValue('Some text...');
     * to:
     * await (await friendPage.addnameBox).setValue('Some text...');
     */
    const ELEM_PROPS = ['length']
    const filterElementCalls = ({ value: { expression: { argument } } }) => (
        argument && argument.callee && argument.callee.property &&
        (
            ELEMENT_COMMANDS.includes(argument.callee.property.name) ||
            ELEM_PROPS.includes(argument.callee.property.name)
        )
    )
    root.find(j.ExpressionStatement)
        .filter(filterElementCalls)
        .forEach((path) => sanitizeAsyncCalls(j, j(path)))

    /**
     * transform lazy loaded elements calls in async context, e.g.
     * await friendPage.addnameBox[0].setValue('Some text...');
     * to:
     * await (await friendPage.addnameBox)[0].setValue('Some text...');
     */
    root.find(j.ExpressionStatement)
        .filter(filterElementCalls)
        .forEach((path) => sanitizeAsyncCalls(j, j(path)))

    /**
     * transform lazy loaded elements calls in async context, e.g.
     * expect(await searchPage.noResultsMsg.isDisplayed()).toBe(true);
     * to:
     * expect(await (await searchPage.noResultsMsg).isDisplayed()).toBe(true);
     */
    root.find(j.ExpressionStatement, {
        expression: { callee: { object: { callee: { name: 'expect' } } } }
    }).forEach((path) => sanitizeAsyncCalls(j, j(path)))

    /**
     * find all `this` with properties we know are elements and make them async
     */
    root.find(j.MemberExpression, {
        object: { type: 'ThisExpression' }
    }).filter((path) => (
        path.parentPath.value.type !== 'AwaitExpression' &&
        [...elementGetters.keys()].map((p) => p.name).includes(path.value.property.name)
    )).replaceWith((path) => {
        j(path).closest(j.FunctionExpression).replaceWith(makeAsync)
        j(path).closest(j.BlockStatement).replaceWith(makeAsync)
        return j.awaitExpression(path.value)
    })

    compilers.update(j, root, autoCompileOpts)
    return root.toSource()
}
