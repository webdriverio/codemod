function isStringLiteral (val) {
    return ['Literal', 'StringLiteral'].includes(val.type)
}

function isNumericalLiteral (val) {
    return ['Literal', 'NumericLiteral'].includes(val.type)
}

module.exports = {
    isStringLiteral,
    isNumericalLiteral
}
