const { COMMAND_TRANSFORMS, COMMANDS_WITHOUT_FIRST_PARAM } = require('./constants')

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

    return root.toSource()
}
