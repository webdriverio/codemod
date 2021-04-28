exports.OBSOLETE_REQUIRE_MODULES = [
    '@babel/register',
    'babel-register',
    'ts-node/register',
    'tsconfig-paths/register'
]

exports.COMPILER_OPTS_MAPPING = {
    '@babel/register': 'babelOpts',
    'babel-register': 'babelOpts',
    'ts-node/register': 'tsNodeOpts',
    'tsconfig-paths/register': 'tsConfigPathsOpts'
}
