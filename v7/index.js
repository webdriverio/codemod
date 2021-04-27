const {
    OBSOLETE_REQUIRE_MODULES,
    COMPILER_OPTS_MAPPING
} = require('./constants')

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    j.file = file
    let autoCompileOpts = {}

    /**
     * transforms imports from `require('cucumber')` to `require('@cucumber/cucumber')`
     */
    root.find(j.CallExpression, {
        callee: { name: 'require' },
        arguments: [{
            value: 'cucumber'
        }]
    }).replaceWith((path) => (
        j.callExpression(
            path.value.callee,
            [j.literal('@cucumber/cucumber')]
        )
    ))
    root.find(j.ImportDeclaration, {
        source: { value: 'cucumber' }
    }).replaceWith((path) => (
        j.importDeclaration(
            path.value.specifiers,
            j.literal('@cucumber/cucumber')
        )
    ))

    /**
     * remove compiler requires
     */
    root.find(j.Property)
        .filter((path) => (
            path.value.key && (
                path.value.key.name === 'require' ||
                path.value.key.name === 'requires' ||
                path.value.key.name === 'requireModule'
            )
        ))
        .replaceWith((path) => {
            return j.objectProperty(
                j.identifier(path.value.key.name),
                j.arrayExpression(path.value.value.elements.filter((value) => {
                    let importName

                    if (value.type === 'Literal') {
                        importName = value.value
                    } else if (value.type === 'ArrayExpression') {
                        importName = value.elements[0].value
                        if (!Object.keys(COMPILER_OPTS_MAPPING).includes(importName)) {
                            return true
                        }
                        autoCompileOpts[COMPILER_OPTS_MAPPING[importName]] = value.elements[1].properties
                    } else {
                        return true
                    }
                    return !OBSOLETE_REQUIRE_MODULES.includes(importName)
                }))
            )
        })

    /**
     * fetch compiler require calls within function blocks
     */
    root.find(j.ExpressionStatement, {
        expression: {
            callee: { object: { callee: { name: 'require' } } }
        }
    }).filter((path) => (
        Object.keys(COMPILER_OPTS_MAPPING).map((c) => c.split('/')[0]).includes(
            path.value.expression.callee.object.arguments.length &&
            path.value.expression.callee.object.arguments[0].value
        )
    )).replaceWith((path) => {
        const compiler = path.value.expression.callee.object.arguments[0].value
        autoCompileOpts[COMPILER_OPTS_MAPPING[`${compiler}/register`]] = path.value.expression.arguments[0].properties
    })
    root.find(j.ArrowFunctionExpression, {
        body: {
            callee: { callee: { name: 'require' } }
        }
    }).filter((path) => (
        Object.keys(COMPILER_OPTS_MAPPING).map((c) => c.startsWith('@') ? c : c.split('/')[0]).includes(
            path.value.body.callee.arguments.length &&
            path.value.body.callee.arguments[0].value
        )
    )).replaceWith((path) => {
        const compiler = path.value.body.callee.arguments[0].value
        const module = compiler.startsWith('@') ? compiler : `${compiler}/register`
        autoCompileOpts[COMPILER_OPTS_MAPPING[module]] = path.value.body.arguments[0].properties
        return []
    })

    /**
     * update config with compiler opts
     */
    let wasReplaced = false
    root.find(j.Property)
        .filter((path) => (
            path.value.key && (
                path.value.key.name === 'mochaOpts' ||
                path.value.key.name === 'jasmineOpts' ||
                path.value.key.name === 'jasmineNodeOpts' ||
                path.value.key.name === 'cucumberOpts'
            )
        ))
        .replaceWith((path) => {
            if (wasReplaced) {
                return path.value
            }

            wasReplaced = true
            return [
                path.value,
                ...(Object.keys(autoCompileOpts).length
                    ? [j.objectProperty(
                        j.identifier('autoCompileOpts'),
                        j.objectExpression([
                            j.property(
                                'init',
                                j.identifier('autoCompile'),
                                j.literal(true)
                            ),
                            ...Object.entries(autoCompileOpts).map(([propName, properties]) => j.property(
                                'init',
                                j.identifier(propName),
                                j.objectExpression(properties)
                            ))
                        ])
                    )]
                    : []
                )
            ]
        })

    return root.toSource()
}
