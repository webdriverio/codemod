const compilers = require(`../common/compilers`);
const {
	EXTRA_COMMANDS,
	HOOKS,
	JS_BUILT_IN,
	EXCLUDE_OBJECTS,
 } = require(`./constants`);

const excludeAsyncWrap = path => {
	const excludes    = [`AwaitExpression`, `ReturnStatement`, `ForOfStatement`];
	const parent_type = path.parent.value.type;

	if(excludes.includes(parent_type)) {
		return true;
	}
}

// Checks if a parent node is browser.execute
const insideExecute = parent => {
	if(
		parent &&
		parent.value &&
		parent.value.expression &&
		parent.value.expression.argument &&
		parent.value.expression.argument.callee &&
		parent.value.expression.argument.callee.object.name === `browser` &&
		parent.value.expression.argument.callee.property.name === `execute`
	) {
			return true;
	}

	if(!parent.parentPath) {
		return false;
	}

	return insideExecute(parent.parentPath);
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
		const args             = path.value.arguments[0];
		const body             = args.body;
		const random           = Math.floor(Math.random() * 10000);
		const placeholder      = `codemod_placeholder_${random}`;
		const left_placeholder = `left_placeholder_${random}`;

		let expression      = null;
		let block_statement = null;
		let declarator      = null;

		// Check if we need to add an extra varaible above the for loop
		// Cases when $$() appears
		// AST explorer saw this as an error .. for await (const foo of $$(`.bar`))
		let placeholder_variable = false;

		// foo.forEach()
		if(path.value.callee.object.name) {
			expression = j.identifier(path.value.callee.object.name);
		}
		// [1,3].forEach()
		else if(path.value.callee.object.elements) {
			expression = j.arrayExpression(path.value.callee.object.elements);
		}
		// foo.bar.forEach()
		else if(path.value.callee.object.object) {
			expression = j.memberExpression(path.value.callee.object.object, path.value.callee.object.property)
		}
		// $$(`.foo`).forEach() or abc.abs(1,6).forEach()
		else {
			placeholder_variable = true;
			expression           = j.identifier(placeholder);
		}

		// foo.forEach(bar());
		if(!body) {
			block_statement = j.blockStatement(
				[j.expressionStatement(path.value.arguments[0])]
			);
		}
		// General forEach
		else if(body.type === `BlockStatement`) {
			block_statement = body;
		}
		// foo.forEach(num => num) single line forEach
		else {
			block_statement = j.blockStatement(
				[j.expressionStatement(body)]
			)
		}

		// foo.forEach(bar());
		if(!args.params) {
			declarator = [
				j.variableDeclarator(
					j.identifier(`foo`),
					null
				)
			]
		}
		// Array of objects
		else if(args.params[0] && args.params[0].properties) {
			declarator = [
				j.variableDeclarator(
					j.objectPattern(
						args.params[0].properties
					),
					null
				)
			]
		}
		// Anything else
		else {
			declarator = args.params;
		}

		const for_statement = j.forOfStatement(
			j.variableDeclaration(
				"const",
				declarator.length ? declarator : [j.identifier(left_placeholder)]
			),
			expression,
			block_statement
		);

		if(placeholder_variable) {
			const varaible_declaration = j.variableDeclaration(
				'let',
				[
					j.variableDeclarator(
						j.identifier(placeholder),
						path.value.callee.object
					)
				]
			);

			return j.program(
				[
					varaible_declaration,
					for_statement
				]
			);
		}

		return for_statement;
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
			// Don't do
			// [...Array(num_users)].map(() => ({ ...options }));
			if(![`ObjectExpression`].includes(path.value.arguments[0].body.type)) {
				path.value.arguments[0].async = true;
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
	// @todo This could be too generic. It will pick up methods that don't need await on them
	root.find(j.CallExpression, {
		callee : {
			type : `MemberExpression`,
			property : {
				type : `Identifier`,
			}
		}
	}).replaceWith(path => {
		if(excludeAsyncWrap(path) || insideExecute(path.parentPath)) {
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

	/*
	// foo();
	root.find(j.CallExpression, {
		callee : {
			type : `Identifier`,
		}
	}).replaceWith(path => {
		if(excludeAsyncWrap(path) || [`$`, `$$`].includes(path.value.callee.name) {
			return path.value;
		}

		return {
			type     : `AwaitExpression`,
			argument : path.value
		}
	});
	*/

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

	compilers.update(j, root, auto_compile_opts, opts);

	return root.toSource();
}
