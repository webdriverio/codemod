const {
    OBSOLETE_REQUIRE_MODULES
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

                        const compileOptsName = importName === '@babel/register'
                            ? 'babelOpts'
                            : importName === 'ts-node/register'
                                ? 'tsNodeOpts'
                                : 'tsConfigPathsOpts'
                        autoCompileOpts[compileOptsName] = value.elements[1].properties
                    } else {
                        throw new Error(`Unexpected require input ${value.type}`)
                    }
                    return !OBSOLETE_REQUIRE_MODULES.includes(importName)
                }))
            )
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
