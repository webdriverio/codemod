const { paramCase } = require('param-case')

const { COMMAND_TRANSFORMS, COMMANDS_WITHOUT_FIRST_PARAM, SERVICE_PROPS, SERVICE_PROP_MAPPING } = require('./constants')

module.exports = function transformer(file, api, opts) {
    const j = api.jscodeshift;
    const root = j(file.source);

    /**
     * transform newWindow
     */
    for (const [command, params] of Object.entries(COMMAND_TRANSFORMS)) {
        root.find(j.CallExpression, {
            callee: { property: { name: command } },
        }).replaceWith((path) => (
            j.callExpression(
                path.value.callee,
                [
                    ...(COMMANDS_WITHOUT_FIRST_PARAM.includes(command)
                        ? []
                        : [path.value.arguments[0]]
                    ),
                    j.objectExpression(path.value.arguments.slice(COMMANDS_WITHOUT_FIRST_PARAM.includes(command) ? 0 : 1).map(
                        (node, i) => node && j.objectProperty(
                            j.identifier(params[i]),
                            node
                        )
                    ).filter(Boolean).filter((node) => (
                        !node.value || node.value.type !== 'Identifier' ||
                        node.value.name !== 'undefined'
                    )))
                ]
            )
        ))
    }

    /**
     * transform command names
     */
    root.find(j.CallExpression, {
        callee: { property: { name: 'launchApp' } }
    }).replaceWith((path) => (
        j.callExpression(
            j.memberExpression(
                path.value.callee.object,
                j.identifier('launchChromeApp')
            ),
            path.value.arguments
        )
    ))

    /**
     * convert Appium configs
     */
    let appiumConfigs, applitoolsConfigs
    const configs = {}
    for (const prop of ['appium', 'applitools', 'firefoxProfile']) {
        root.find(j.ObjectExpression)
            .filter((path) => {
                const props = path.value.properties.map((p) => p.key && p.key.name).filter(Boolean)
                return props.includes('services') && props.includes(prop)
            })
            .replaceWith((path) => {
                configs[paramCase(prop)] = path.value.properties
                    .find((p) => p.key && p.key.name === prop)
                    .value
                return j.objectExpression(
                    path.value.properties
                        .filter((p) => p.key && p.key.name !== prop)
                )
            })
    }
    for (const [service, props] of Object.entries(SERVICE_PROPS)) {
        root.find(j.ObjectExpression)
            .filter((path) => path.value.properties.find((p) => (
                p.key &&
                p.key.name === 'services' &&
                p.value.elements.find((elem) => elem.value === service)
            )))
            .replaceWith((path) => {
                configs[service] = j.objectExpression(path.value.properties
                    .filter((p) => p.key && props.includes(p.key.name))
                    .map((p) => {
                        if (!SERVICE_PROP_MAPPING[service] || !SERVICE_PROP_MAPPING[service][p.key.name]) {
                            return p
                        }
                        return j.property(
                            'init',
                            j.identifier(SERVICE_PROP_MAPPING[service][p.key.name]),
                            p.value
                        )
                    })
                )
                return j.objectExpression(
                    path.value.properties
                        .filter((p) => p.key && !props.includes(p.key.name))
                )
            })
    }

    root.find(opts.parser === 'babel' ? j.Property : j.ObjectProperty, {
        key: { name: 'services' }
    }).replaceWith((path) => j.property(
        'init',
        j.identifier('services'),
        j.arrayExpression(path.value.value.elements.map((elem) => {
            if (Object.keys(configs).includes(elem.value)) {
                return j.arrayExpression([
                    j.literal(elem.value),
                    configs[elem.value]
                ])
            }
            return elem
        }))
    ))

    return root.toSource(opts.printOptions)
}
