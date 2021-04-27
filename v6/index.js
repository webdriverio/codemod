const { COMMAND_TRANSFORMS } = require('./constants')

module.exports = function transformer(file, api) {
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
                    path.value.arguments[0],
                    j.objectExpression(path.value.arguments.slice(1).map(
                        (node, i) => node && j.objectProperty(
                            j.identifier(params[i]),
                            node
                        )
                    ).filter(Boolean))
                ]
            )
        ))
    }

    return root.toSource()
}
