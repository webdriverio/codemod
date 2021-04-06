const SUPPORTED_SELECTORS = ['id', 'model', 'css']

function getSelectorArgument (j, path) {
  const args = []
  const bySelector = path.value.arguments[0].callee.property.name

  if (bySelector === 'id') {
    args.push(j.literal(`#${path.value.arguments[0].arguments[0].value}`))
  } else if (bySelector === 'model') {
    args.push(j.literal(`*[ng-model="${path.value.arguments[0].arguments[0].value}"]`))
  } else if (bySelector === 'css') {
    args.push(...path.value.arguments[0].arguments)
  }

  return args
}

function matchesSelectorExpression (path) {
  return (
    path.value.arguments.length === 1 &&
    path.value.arguments[0].callee.type === 'MemberExpression' &&
    path.value.arguments[0].callee.object.name === 'by' &&
    SUPPORTED_SELECTORS.includes(path.value.arguments[0].callee.property.name)
  )
}

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    
    /**
     * transform:
     * element(...)
     * $('...')
     */
    root.find(j.CallExpression)
      .filter((path) => (
        path.value.callee &&
        path.value.callee.type === 'Identifier' &&
        path.value.callee.name === 'element' &&
        matchesSelectorExpression(path)
      ))
      .replaceWith((path) => (
        j.callExpression(
          j.identifier('$'),
          getSelectorArgument(j, path)
        )
      ))
    
    /**
     * transform:
     * element.all(...)
     * $$('...')
     */
    root.find(j.CallExpression)
      .filter((path) => (
        path.value.callee &&
        path.value.callee.type === 'MemberExpression' &&
        path.value.callee.object.name === 'element' &&
        path.value.callee.property.name === 'all' &&
        matchesSelectorExpression(path)
      ))
      .replaceWith((path) => j.callExpression(
        j.identifier('$$'),
        getSelectorArgument(j, path)
      ))
  
    return root.toSource();
}