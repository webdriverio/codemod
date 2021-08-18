const compilers = require('../common/compilers')

const wrapWithAsync = path => {
    if (path.parent.value.type !== "AwaitExpression") {
        if (path.parent.property && path.parent.property.type === "Identifier") {
            // add () to parent on chained calls
            path.parent.extra.parenthesized = true
        }
        return {
            type: 'AwaitExpression',
            argument: path.value
        }
    }
    return path.value
};

module.exports = function transformer(file, api, opts) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const autoCompileOpts = compilers.remove(j, root, opts)

    /**
     * transforms all it() parameter to async
     */
    root.find(j.CallExpression, { callee: { name: 'it' } }).replaceWith(
        path => {
            if (path.value.arguments[1] && path.value.arguments[1].type === "ArrowFunctionExpression") {
                path.value.arguments[1].async = true
            }
            return path.value
        }
    )

    /**
     * transforms $ and $$ calls to async
     */
    root.find(j.CallExpression, { callee: { name: '$' } }).replaceWith(
        wrapWithAsync
    )
    root.find(j.CallExpression, { callee: { name: '$$' } }).replaceWith(
        wrapWithAsync
    )

    compilers.update(j, root, autoCompileOpts, opts)
    return root.toSource()
}
