const compilers = require('../common/compilers')

module.exports = function transformer(file, api, opts) {
    const j = api.jscodeshift;
    const root = j(file.source);
    const autoCompileOpts = compilers.remove(j, root, opts)

    /**
     * transforms all it() parameter to async
     */
    root.find(j.CallExpression, { callee: { name: 'it'} }).replaceWith(
        path => {
          if (path.value.arguments[1] && path.value.arguments[1].type === "ArrowFunctionExpression") {
            path.value.arguments[1].async = true
          }
          return path.value
        }
    )

    compilers.update(j, root, autoCompileOpts, opts)
    return root.toSource()
}
