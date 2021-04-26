module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    j.file = file

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

    return root.toSource()
}
