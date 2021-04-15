const url = require('url')
const { format } = require('util')

const {
    IGNORED_CONFIG_PROPERTIES,
    UNSUPPORTED_CONFIG_OPTION_ERROR,
    UNSUPPORTED_SELECTOR_STRATEGIES,
    REPLACE_CONFIG_KEYS,
    IGNORED_CAPABILITIES
} = require('./constants')

function isCustomStrategy (path) {
    return !SUPPORTED_SELECTORS.includes(
        path.value.arguments[0].callee.property.name
    )
}

class TransformError extends Error {
    constructor(message, expr, file) {
        const source = file.source.split('\n')
        const line = source.slice(expr.loc.start.line - 1, expr.loc.end.line)[0]
        const expression = line.slice(0, expr.loc.end.column)
        const errorMsg = `Error transforming ${file.path.replace(process.cwd(), '')}:${expr.loc.start.line}`
        super(errorMsg)
        this.stack = (
            errorMsg + '\n\n' +
            `> ${expression}\n` +
            ' '.repeat(expr.loc.start.column + 2) + '^\n\n' +
            message + '\n' +
            `  at ${file.path}:${expr.loc.start.line}:${expr.loc.start.column}`
        )
        this.name = this.constructor.name
    }
}

function getSelectorArgument (j, path, callExpr, file) {
    const bySelector = callExpr.callee.property.name
    const arg = callExpr.arguments[0]

    if (Object.keys(UNSUPPORTED_SELECTOR_STRATEGIES).includes(bySelector)) {
        throw new TransformError(
            UNSUPPORTED_SELECTOR_STRATEGIES[bySelector],
            path.value,
            file
        )
    } else if (bySelector === 'id') {
        return [j.literal(`#${arg.value}`)]
    } else if (bySelector === 'model') {
        return [j.literal(`*[ng-model="${arg.value}"]`)]
    } else if (bySelector === 'css') {
        return [...callExpr.arguments]
    } else if (bySelector === 'cssContainingText') {
        const text = callExpr.arguments[1]

        if (text.regex) {
            throw new TransformError('this codemod does not support RegExp in cssContainingText', path.value, file)
        } else if (text.type === 'Literal') {
            return [j.literal(`${arg.value}=${text.value}`)]
        } else if (text.type === 'Identifier') {
            return [
                j.binaryExpression(
                    '+',
                    j.literal(arg.value + '='),
                    j.identifier(text.name)
                )
            ]
        } else {
            throw new TransformError('expect 2nd parameter of cssContainingText to be a literal or identifier', path.value, file)
        }
    } else if (bySelector === 'xpath' || bySelector === 'tagName' || bySelector === 'js') {
        return [arg]
    } else if (bySelector === 'linkText') {
        return [j.literal(`=${arg.value}`)]
    } else if (bySelector === 'partialLinkText') {
        return [j.literal(`*=${arg.value}`)]
    } else if (bySelector === 'name') {
        return [j.literal(`*[name="${arg.value}"]`)]
    } else if (bySelector === 'className') {
        return [j.literal(`.${arg.value}`)]
    } else if (bySelector === 'options') {
        return [j.literal(`select[ng-options="${arg.value}"] option`)]
    } else if (bySelector === 'buttonText') {
        return [j.literal(`button=${arg.value}`)]
    } else if (bySelector === 'partialButtonText') {
        return [j.literal(`button*=${arg.value}`)]
    }


    // we assume a custom locator strategy
    const selectorStrategyName = callExpr.callee.property.name
    const selector = callExpr.arguments[0].value
    return [
        j.literal(selectorStrategyName),
        j.literal(selector)
    ]
}

function matchesSelectorExpression (path) {
    return (
        path.value.arguments.length === 1 &&
        path.value.arguments[0].callee.type === 'MemberExpression' &&
        path.value.arguments[0].callee.object.name === 'by'
    )
}

function replaceCommands (prtrctrCommand) {
    switch (prtrctrCommand) {
        // element commands
        case 'sendKeys':
            return 'setValue'
        case 'isPresent':
            return 'isExisting'
        case 'getDriver':
            return 'parentElement'
        // browser commands
        case 'executeScript':
            return 'execute'
        case 'getPageSource':
            return 'getSource'
        case 'get':
            return 'url'
        case 'sleep':
            return 'pause'
        case 'frame':
            return 'switchToFrame'
        case 'window':
            return 'switchToWindow'
        case 'enterRepl':
        case 'explore':
            return 'debug'
        case 'getCurrentUrl':
        case 'getLocationAbsUrl':
            return 'getUrl'
        case 'wait':
            return 'waitUntil'
        case 'close':
            return 'closeWindow'
        case 'restart':
        case 'restartSync':
            return 'reloadSession'
        case 'getAllWindowHandles':
            return 'getWindowHandles'
        case 'clear':
            return 'clearValue'
        default: return prtrctrCommand
    }
}

function parseSeleniumAddress (value) {
    const u = url.parse(value)
    remoteHostname = u.hostname
    return [
        this.objectProperty(
            this.identifier('protocol'),
            this.stringLiteral(u.protocol.slice(0, -1))
        ),
        this.objectProperty(
            this.identifier('hostname'),
            this.stringLiteral(u.hostname)
        ),
        this.objectProperty(
            this.identifier('port'),
            this.literal(parseInt(u.port || '443'))
        ),
        this.objectProperty(
            this.identifier('path'),
            this.stringLiteral(u.path)
        )
    ]
}

let remoteHostname = null
function parseConfigProperties (property) {
    const name = property.key.name || property.key.value
    const value = property.value.value
    if (name === 'seleniumAddress') {
        return parseSeleniumAddress.call(this, value)
    } else if (name === 'capabilities') {
        const { rootLevelConfigs, parsedCaps } = parseCapabilities.call(this, property.value.properties)
        return [
            ...rootLevelConfigs,
            this.objectProperty(
                this.identifier(name),
                this.arrayExpression([this.objectExpression(parsedCaps)])
            )
        ]
    } else if (name === 'multiCapabilities') {
        const rlc = []
        const pc = []

        for (const caps of property.value.elements) {
            const { rootLevelConfigs, parsedCaps } = parseCapabilities.call(this, caps.properties)
            rlc.push(...rootLevelConfigs)
            pc.push(this.objectExpression(parsedCaps))
        }

        return [
            ...rlc,
            this.objectProperty(
                this.identifier('capabilities'),
                this.arrayExpression(pc)
            )
        ]

    } else if (REPLACE_CONFIG_KEYS[name]) {
        return this.objectProperty(
            this.identifier(REPLACE_CONFIG_KEYS[name]),
            property.value
        )
    } else if (name === 'suites') {
        return this.objectProperty(
            this.identifier('suites'),
            this.objectExpression(property.value.properties.map((prop) => (
                this.objectProperty(
                    this.identifier(prop.key.name),
                    this.arrayExpression([this.literal(prop.value.value)])
                )
            )))
        )
    } else if (name === 'seleniumServerJar') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "@wdio/selenium-standalone-service"',
            'https://webdriver.io/docs/selenium-standalone-service'
        ), property.value, this.file)
    } else if (name === 'localSeleniumStandaloneOpts') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "@wdio/selenium-standalone-service"',
            'https://webdriver.io/docs/selenium-standalone-service#args'
        ), property.value, this.file)
    } else if (name === 'chromeDriver') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "wdio-chromedriver-service"',
            'https://www.npmjs.com/package/wdio-chromedriver-service'
        ), property.value, this.file)
    } else if (name === 'geckoDriver') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "wdio-geckodriver-service"',
            'https://www.npmjs.com/package/wdio-geckodriver-service'
        ), property.value, this.file)
    } else if (name === 'sauceProxy') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "@wdio/sauce-service"',
            'https://webdriver.io/docs/sauce-service#sauceconnect'
        ), property.value, this.file)
    } else if (name === 'sauceBuild') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'custom vendor capabilities, e.g.\n\n' +
            'capabilities: [{\n' +
            '  browserName: "chrome",\n' +
            '  sauce:options: {\n' +
            '    build: "My Build #123",\n' +
            '    name: "My Sauce Labs job"\n' +
            '  }\n' +
            '}]\n\n',
            'https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options#TestConfigurationOptions-OptionalSauce-SpecificCapabilitiesforBrowserTests'
        ), property.value, this.file)
    } else if (name === 'firefoxPath') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'custom browser capabilities, e.g.\n\n' +
            'capabilities: [{\n' +
            '  browserName: "firefox",\n' +
            '  moz:options: {\n' +
            '    binary: "/path/to/firefox/binary"\n' +
            '  }\n' +
            '}]\n\n',
            'https://firefox-source-docs.mozilla.org/testing/geckodriver/Flags.html?highlight=firefoxoptions#code-b-var-binary-var-code-code-binary-var-binary-var-code'
        ), property.value, this.file)
    } else if (name === 'allScriptsTimeout' || name === 'getPageTimeout') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "setTimeouts" command to execute within the before hook of your wdio.conf.js',
            'https://webdriver.io/docs/api/webdriver#settimeouts'
        ), property.value, this.file)
    } else if (name === 'params') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'environment variables',
            'https://webdriver.io/docs/organizingsuites'
        ), property.value, this.file)
    } else if (name === 'resultJsonOutputFile') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'the "wdio-json-reporter"',
            'https://www.npmjs.com/package/wdio-json-reporter'
        ), property.value, this.file)
    } else if (name === 'plugins') {
        throw new TransformError(format(
            UNSUPPORTED_CONFIG_OPTION_ERROR,
            name,
            'custom services',
            'https://webdriver.io/docs/customservices'
        ), property.value, this.file)
    } else if (IGNORED_CONFIG_PROPERTIES.includes(name)) {
        return []
    }

    return property
}

function parseCapabilities (caps) {
    const rootLevelConfigs = []
    const parsedCaps = []

    for (const cap of caps) {
        const name = cap.key.name || cap.key.value
        if (name === 'name') {
            if (!remoteHostname || (!remoteHostname.includes('browserstack') && !remoteHostname.includes('saucelabs'))) {
                continue
            }
            parsedCaps.push(
                this.objectProperty(
                    this.literal('sauce:options'),
                    this.objectExpression([
                        this.objectProperty(
                            this.identifier('name'),
                            this.literal(cap.value.value)
                        )
                    ])
                )
            )
        } else if (name === 'seleniumAddress') {
            parsedCaps.push(...parseSeleniumAddress.call(this, cap.value.value))
        } else if (name === 'chromeOptions') {
            parsedCaps.push(
                this.objectProperty(
                    this.literal('goog:chromeOptions'),
                    cap.value
                )
            )
        } else if (name === 'firefoxOptions') {
            parsedCaps.push(
                this.objectProperty(
                    this.literal('moz:firefoxOptions'),
                    cap.value
                )
            )
        } else if (!IGNORED_CAPABILITIES.includes(name)) {
            parsedCaps.push(cap)
        }
    }

    return { rootLevelConfigs, parsedCaps }
}

module.exports = {
    isCustomStrategy,
    TransformError,
    getSelectorArgument,
    matchesSelectorExpression,
    replaceCommands,
    parseConfigProperties
}
