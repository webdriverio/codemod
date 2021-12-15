const compilers            = require(`../common/compilers`);
const { ELEMENT_COMMANDS } = require(`../common/constants`);
const {
	EXTRA_COMMANDS,
	METHODS,
	HOOKS,
	JS_BUILT_IN,
 } = require(`./constants`);

const excludeAsyncWrap = path => {
	const excludes    = [`AwaitExpression`, `ReturnStatement`];
	const parent_type = path.parent.value.type;

	if(excludes.includes(parent_type)) {
		return true;
	}
}

module.exports = function transformer(file, api, opts) {
	const j                 = api.jscodeshift;
	const root              = j(file.source);
	const auto_compile_opts = compilers.remove(j, root, opts);

	// Convert forEach to regular for loops
	root.find(j.CallExpression, {
		callee : {
			property : {
				name : "forEach"
			}
		}
	})
	.replaceWith(path => {
		// Handles foo.forEach() and [1,2].forEach()
		const expression = path.value.callee.object.name ? j.identifier(path.value.callee.object.name) : j.arrayExpression(path.value.callee.object.elements);

		return j.forOfStatement(
		  j.variableDeclaration(
				"const",
				path.value.arguments[0].params
		  ),
		  expression,
		  path.value.arguments[0].body
		)
	});

	// Transforms all hooks/it's parameter to async
	HOOKS.forEach(name => {
		root.find(j.CallExpression, {
			callee : {
				name
			}
		}).replaceWith(path => {
			const index = [`it`, `test`].includes(name) ? 1 : 0;

			if(path.value.arguments[index] && path.value.arguments[index].type === `ArrowFunctionExpression`) {
				path.value.arguments[index].async = true
			}

			return path.value;
		});
	});

	// Handle $$
	root.find(j.CallExpression, {
		callee : {
			name : `$$`,
		}
	}).replaceWith(path => {
		if(excludeAsyncWrap(path)) {
			return path.value;
		}

		return {
			type     : `AwaitExpression`,
			argument : path.value
		}
	});

	// Add await to all calls to class methods
	// This will handle chained methods
	// E.g. LoginPage.login()
	// @todo This might be too generic. It will pick up methods that don't need await on them
	root.find(j.CallExpression, {
		callee : {
			type : `MemberExpression`,
			property : {
				type : `Identifier`,
			}
		}
	}).replaceWith(path => {
		if(excludeAsyncWrap(path)) {
			return path.value;
		}

		// Exclude any built in javascipt functions
		if(JS_BUILT_IN.includes(path.value.callee.property.name)) {
			return path.value
		}

		return {
			type     : `AwaitExpression`,
			argument : path.value
		}
	});

	// Set all method definitions to async. excludes "get", "set"
	root.find(j.MethodDefinition, {
		kind : `method`
	}).replaceWith(path => {
		path.value.value.async = true;

		return path.value;
	});

	compilers.update(j, root, auto_compile_opts, opts);

	return root.toSource();
}
