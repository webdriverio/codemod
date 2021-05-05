const {
    OBSOLETE_REQUIRE_MODULES,
    COMPILER_OPTS_MAPPING
} = require('./constants')

exports.remove = function removeCompilers (j, root) {
    const autoCompileOpts = {}

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
    root.find(j.ExpressionStatement, {
        expression: { callee: {
            callee: { name: 'require' }
        } }
    }).filter((path) => (
        Object.keys(COMPILER_OPTS_MAPPING).includes(path.value.expression.callee.arguments[0].value)
    )).replaceWith((path) => {
        const compiler = path.value.expression.callee.arguments[0].value
        const module = compiler.startsWith('@') || compiler === 'babel-register' ? compiler : `${compiler}/register`
        autoCompileOpts[COMPILER_OPTS_MAPPING[module]] = path.value.expression.arguments[0].properties
        return []
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

    return autoCompileOpts
}

exports.update = function (j, root, autoCompileOpts) {
    /**
     * update config with compiler opts
     */
    let wasReplaced = false
    root.find(j.ObjectProperty)
        .filter((path) => (
            path.value.key && (
                path.value.key.name === 'capabilities' ||
                path.value.key.name === 'framework'
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
}
