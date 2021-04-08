const SUPPORTED_SELECTORS = ['id', 'model', 'css', 'binding', 'cssContainingText']
const ELEMENT_COMMANDS = ['sendKeys', 'isPresent', 'isElementPresent']

class TransformError extends Error {
  constructor(message, path, file) {
    const source = file.source.split('\n')
    const line = source.slice(path.value.loc.start.line - 1, path.value.loc.end.line)[0]
    const expression = line.slice(0, path.value.loc.end.column)
    const errorMsg = `Error transforming ${file.path.replace(process.cwd(), '')}:${path.value.loc.start.line}`
    super(errorMsg)
    this.stack = (
      errorMsg + '\n\n' +
      `> ${expression}\n` +
      ' '.repeat(path.value.callee.loc.start.column + 2) + '^\n\n' +
      message + '\n' +
      `  at ${file.path}:${path.value.loc.start.line}:${path.value.loc.start.column}`
    )
    this.name = this.constructor.name
  }
}

function getSelectorArgument (j, callExpr, file) {
  const args = []
  // console.log(callExpr);
  const bySelector = callExpr.callee.property.name

  if (bySelector === 'id') {
    args.push(j.literal(`#${callExpr.arguments[0].value}`))
  } else if (bySelector === 'model') {
    args.push(j.literal(`*[ng-model="${callExpr.arguments[0].value}"]`))
  } else if (bySelector === 'css') {
    args.push(...callExpr.arguments)
  } else if (bySelector === 'cssContainingText') {
    const selector = callExpr.arguments[0]
    const text = callExpr.arguments[1]

    if (text.type === 'Literal') {
      args.push(j.literal(`${selector.value}=${text.value}`))
    } else if (text.type === 'Identifier') {
      args.push(
        j.binaryExpression(
          '+',
          j.literal(selector.value + '='),
          j.identifier(text.name)
        )
      )
    } else {
      throw new TransformError('expect 2nd parameter of cssContainingText to be a literal or identifier', path, file)
    }
    
    if (text.regex) {
      throw new TransformError('this codemod does not support RegExp in cssContainingText', path, file)
    }
  } else if (bySelector === 'binding') {
    throw new TransformError('Binding selectors (by.binding) are not supported, please consider refactor this line', path, file)
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

function replaceCommands (prtrctrCommand) {
  switch (prtrctrCommand) {
    // element commands
    case 'sendKeys':
      return 'setValue'
    case 'isPresent':
      return 'isExisting'
    // browser commands
    case 'executeScript':
      return 'execute'
    case 'getPageSource':
      return 'getSource'
    case 'get':
      return 'url'
    case 'sleep':
      return 'pause'
    case 'enterRepl':
    case 'explore':
      return 'debug'
    case 'getCurrentUrl':
    case 'getLocationAbsUrl':
      return 'getUrl'
    case 'wait':
      return 'waitUntil'
    case 'getAllWindowHandles':
      return 'getWindowHandles'
    default: return prtrctrCommand
  }
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
        getSelectorArgument(j, path.value.arguments[0], file)
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
      getSelectorArgument(j, path.value.arguments[0], file)
    ))
  
  /**
   * transform browser commands
   */
  root.find(j.CallExpression)
    .filter((path) => (
      path.value.callee &&
      path.value.callee.type === 'MemberExpression' &&
      path.value.callee.object.name === 'browser'
    ))
    .replaceWith((path) => j.callExpression(
      j.memberExpression(
        path.value.callee.object,
        j.identifier(replaceCommands(path.value.callee.property.name))
      ),
      path.value.arguments
    ))
  
  /**
   * transform element commands
   */
  root.find(j.CallExpression)
    .filter((path) => (
      path.value.callee &&
      path.value.callee.type === 'MemberExpression' &&
      ELEMENT_COMMANDS.includes(path.value.callee.property.name)
    ))
    .replaceWith((path) => {
      /**
       * transform `element(by.css('#abc')).isElementPresent(by.css('#def'))`
       * to `$('#abc').$('#def')`
       */
      if (path.value.callee.property.name === 'isElementPresent') {
        return j.callExpression(
          j.memberExpression(
            j.callExpression(
              j.memberExpression(
                path.value.callee.object,
                j.identifier('$')
              ),
              getSelectorArgument(j, path.value.arguments[0], file)
            ),
            j.identifier('isExisting')
          ),
          []
        )
      }

      /**
       * transform any other element command
       */
      return j.callExpression(
        j.memberExpression(
          path.value.callee.object,
          j.identifier(replaceCommands(path.value.callee.property.name))
        ),
        path.value.arguments
      )
    })
  
  /**
   * transform element chaining
   */
  root.find(j.CallExpression)
    .filter((path) => (
      path.value.callee &&
      path.value.callee.type === 'MemberExpression' &&
      ['element', 'elements'].includes(path.value.callee.property.name)
    ))
    .replaceWith((path) => {
      const chainedCommand = path.value.callee.property.name === 'element'
        ? '$'
        : '$$'
      return j.callExpression(
        j.memberExpression(
          path.value.callee.object,
          j.identifier(chainedCommand)
        ),
        getSelectorArgument(j, path.value.arguments[0], file)
      )
    })
  
  /**
   * replace await/then calls, e.g.
   * ```
   * await browser.getAllWindowHandles().then(handles => {
   *   browser.switchTo().window(handles[handles.length - 1]);
   * })
   * ```
   * to:
   * ```
   * const handles = await browser.getAllWindowHandles()
   * browser.switchTo().window(handles[handles.length - 1]);
   * ```
   */
  root.find(j.ExpressionStatement)
    .filter((path) => (
      path.value.expression &&
      path.value.expression.type === 'AwaitExpression' &&
      path.value.expression.argument.type === 'CallExpression' &&
      path.value.expression.argument.callee.property.name === 'then'
    ))
    .replaceWith((path) => {
      return [
        j.variableDeclaration(
          'let',
          [
            j.variableDeclarator(
              j.identifier(path.value.expression.argument.arguments[0].params[0].name),
              j.awaitExpression(path.value.expression.argument.callee.object)
            )
          ]
        ),
        ...path.value.expression.argument.arguments[0].body.body
      ]
    })

  return root.toSource();
}