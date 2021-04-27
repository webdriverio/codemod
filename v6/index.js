const { WINDOW_PARAMS } = require('./constants')

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    /**
     * transform newWindow
     */
    root.find(j.CallExpression, {
        callee: { property: { name: 'newWindow' } },
    }).replaceWith((path) => (
        j.callExpression(
            path.value.callee,
            [
                path.value.arguments[0],
                j.objectExpression(path.value.arguments.slice(1).map(
                    (node, i) => node && j.objectProperty(
                        j.identifier(WINDOW_PARAMS[i]),
                        node
                    )
                ).filter(Boolean))
            ]
        )
    ))

    return root.toSource()
}
