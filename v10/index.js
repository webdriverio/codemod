/**
 * Mechanical v9 → v10 command signature updates:
 * - addCommand / overwriteCommand boolean scope → `{ attachToElement }`
 * - getHTML(boolean) → getHTML({ includeSelectorTag })
 * - getCookies('name') / getCookies(['name']) / getCookie('name') → getCookies({ name })
 */
module.exports = function transformer (file, api) {
    const j = api.jscodeshift
    const root = j(file.source)

    root.find(j.CallExpression).forEach((path) => {
        const callee = path.value.callee
        const name = memberName(callee)
        if (!name) {
            return
        }

        const args = path.value.arguments
        if ((name === 'addCommand' || name === 'overwriteCommand') && isBoolean(args[2])) {
            const properties = [
                property(j, 'attachToElement', args[2])
            ]
            if (args[3] && !isUndefined(args[3])) {
                properties.push(property(j, 'proto', args[3]))
            }
            if (args[4] && !isUndefined(args[4])) {
                properties.push(property(j, 'instances', args[4]))
            }
            path.value.arguments = [args[0], args[1], j.objectExpression(properties)]
            return
        }

        if (name === 'getHTML' && args.length === 1 && isBoolean(args[0])) {
            path.value.arguments = [
                j.objectExpression([property(j, 'includeSelectorTag', args[0])])
            ]
            return
        }

        if (name !== 'getCookies' && name !== 'getCookie') {
            return
        }

        const filter = cookieNameFilter(j, args[0])
        if (!filter) {
            return
        }

        if (name === 'getCookie') {
            renameMember(callee, 'getCookies')
        }
        args[0] = filter
    })

    return root.toSource()
}

function memberName (callee) {
    if (!callee || !callee.property || callee.computed && !isString(callee.property)) {
        return
    }
    if (callee.property.type === 'Identifier') {
        return callee.property.name
    }
    if (isString(callee.property)) {
        return callee.property.value
    }
}

function renameMember (callee, name) {
    if (callee.property.type === 'Identifier') {
        callee.property.name = name
        return
    }
    callee.property.value = name
    if ('extra' in callee.property && callee.property.extra) {
        callee.property.extra.raw = `'${name}'`
    }
}

function property (j, key, value) {
    return j.property('init', j.identifier(key), value)
}

function isBoolean (node) {
    return Boolean(node) && (
        node.type === 'BooleanLiteral' ||
        (node.type === 'Literal' && typeof node.value === 'boolean')
    )
}

function isString (node) {
    return Boolean(node) && (
        node.type === 'StringLiteral' ||
        (node.type === 'Literal' && typeof node.value === 'string')
    )
}

function isUndefined (node) {
    return (node.type === 'Identifier' && node.name === 'undefined') ||
        (node.type === 'UnaryExpression' && node.operator === 'void')
}

function cookieNameFilter (j, node) {
    if (isString(node)) {
        return j.objectExpression([property(j, 'name', node)])
    }

    if (
        node &&
        node.type === 'ArrayExpression' &&
        node.elements.length === 1 &&
        isString(node.elements[0])
    ) {
        return j.objectExpression([property(j, 'name', node.elements[0])])
    }
}
