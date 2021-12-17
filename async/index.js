const compilers = require(`../common/compilers`);
const {
	EXTRA_COMMANDS,
	HOOKS,
	JS_BUILT_IN,
	EXCLUDE_OBJECTS,
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

	// Transform waitUnitl, map, etc.
	EXTRA_COMMANDS.forEach(name => {
		root.find(j.CallExpression, {
			callee : {
				property : {
					name,
				}
			}
		}).replaceWith(path => {
			path.value.arguments[0].async = true;

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
			return path.value;
		}

		// Exclude custom objects
		if(EXCLUDE_OBJECTS.includes(path.value.callee.object.name)) {
			return path.value;
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

	// Set all method definitions to async. excludes "get", "set"
	// Needed for tsx
	root.find(j.ClassMethod, {
		kind : `method`
	}).replaceWith(path => {
		path.value.async = true;

		return path.value;
	});

	// Set all function definitions to async
	root.find(j.FunctionDeclaration).replaceWith(path => {
		path.value.async = true;

		return path.value;
	});

	// Remove awaits from inside browser.execute that were added from the above transform
	root.find(j.CallExpression, {
		callee : {
			type : `MemberExpression`,
			property : {
				type : `Identifier`,
				name : `execute`
			}
		}
	}).replaceWith(path => {
		const blocks = [];

		path.value.arguments[0].body.body.forEach(body => {
			blocks.push(
				j.expressionStatement(
					body.expression.argument
				)
			)
		});

		return j.expressionStatement(
			j.callExpression(
				path.value.callee,
				[
					j.arrowFunctionExpression(
						path.value.arguments[0].params,
						j.blockStatement(blocks)
					)
				]
			)
		);
	});

	compilers.update(j, root, auto_compile_opts, opts);

	return root.toSource();
}
