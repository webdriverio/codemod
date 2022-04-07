const compilers = require(`../common/compilers`);
const {
	EXTRA_COMMANDS,
	HOOKS,
	JS_BUILT_IN,
	EXCLUDE_OBJECTS,
	EXCLUDE_METHODS,
	AWAIT_CUSTOM_GETTERS,
 } = require(`./constants`);

// Exclude await if already await'ed, a return line or for of loop
const excludeAsyncWrap = path => {
	const excludes    = [`AwaitExpression`, `ReturnStatement`, `ForOfStatement`];
	const parent_type = path.parent.value.type;

	if(excludes.includes(parent_type)) {
		return true;
	}
}

// Don't await certain functions and methods
const excludeAsyncCustom = test_object => {
	if(!test_object) {
		return false;
	}

	// Add to this array when more come up
	if([`moment`].includes(test_object.name)) {
		return true;
	}

	return excludeAsyncCustom(test_object.callee || test_object.object);
}

// Checks if a parent node is browser.execute
const insideExecute = parent => {
	if(!parent || !parent.value) {
		return false;
	}

	const value = parent.value;

	if(
		// Plain browser.execute without the return value being assigned
		(
			value.expression &&
			value.expression.argument &&
			value.expression.argument.callee &&
			value.expression.argument.callee.object &&
			value.expression.argument.callee.object.name === `browser` &&
			value.expression.argument.callee.property.name === `execute`
		) ||
		// browser.execute with variable declarator
		// e.g. const foo = browser.execute();
		(
			value.type === `VariableDeclarator` &&
			value.init &&
			value.init.argument &&
			value.init.argument.callee &&
			value.init.argument.callee.object &&
			value.init.argument.callee.object.name === `browser` &&
			value.init.argument.callee.property.name === `execute`
		) ||
		// browser.execute with return
		(
			value.type === `ReturnStatement` &&
			value.argument &&
			value.argument.callee &&
			value.argument.callee.object &&
			value.argument.callee.object.name === `browser` &&
			value.argument.callee.property.name === `execute`
		) ||
		// With assignemnt but not declarating a variable
		// e.g. foo = browser.execute();
		(
			value.type === `AssignmentExpression` &&
			value.right.argument &&
			value.right.argument.callee &&
			value.right.argument.callee.object &&
			value.right.argument.callee.object.name === `browser` &&
			value.right.argument.callee.property.name === `execute`
		)
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
		const multiple_params  = args.params && args.params.length > 1;
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
			if(multiple_params) {
				expression = j.callExpression(
					j.memberExpression(
						path.value.callee.object,
						j.identifier(`entries`)
					),
					[]
				);
			}
			else {
				expression = j.identifier(path.value.callee.object.name);
			}
		}
		// [1,3].forEach()
		else if(path.value.callee.object.elements) {
			if(multiple_params) {
				expression = j.callExpression(
					j.memberExpression(
						j.arrayExpression(path.value.callee.object.elements),
						j.identifier(`entries`)
					),
					[]
				);
			}
			else {
				expression = j.arrayExpression(path.value.callee.object.elements);
			}
		}
		// foo.bar.forEach()
		// @todo This could recurse to go deeper but not going to worry about it now
		else if(path.value.callee.object.object) {
			if(multiple_params) {
				expression = j.callExpression(
					j.memberExpression(
						path.value.callee.object,
						j.identifier(`entries`)
					),
					[]
				);
			}
			else {
				expression = j.memberExpression(path.value.callee.object.object, path.value.callee.object.property);
			}
		}
		// $$(`.foo`).forEach() or abc.abs(1,6).forEach()
		else {
			placeholder_variable = true;
			if(multiple_params) {
				expression = j.callExpression(
					j.memberExpression(
						j.identifier(placeholder),
						j.identifier(`entries`)
					),
					[]
				);
			}
			else {
				expression = j.identifier(placeholder);
			}
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
		// [1,2].forEach((num, index) => console.log(num, index)});
		// Reverse the order of the arguments in forEach so the match what is used in .entries()
		else if(multiple_params) {
			declarator = [j.variableDeclarator(
				j.arrayPattern(args.params.reverse())
			)];
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
			const index = [`it`, `xit`, `test`, `describe`, `xdescribe`].includes(name) ? 1 : 0;

			if(path.value.arguments[index] && path.value.arguments[index].type === `ArrowFunctionExpression`) {
				path.value.arguments[index].async = true
			}

			return path.value;
		});
	});

	// Wrap all .map in Promise.all
	root.find(j.CallExpression, {
		callee : {
			property : {
				name : `map`
			}
		}
	}).replaceWith(path => {
		// If map has already been wrapped in a Promise then don't do anything
		if(
			path.parent.value.callee &&
			path.parent.value.callee.object &&
			path.parent.value.callee.object.name === `Promise`
		) {
			return path.value;
		}

		const expression = j.callExpression(
			j.memberExpression(
				j.identifier(`Promise`),
				j.identifier(`all`)
			),
			[
				j.callExpression(
					path.value.callee,
					path.value.arguments
				)
			]
		);

		return expression;
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
			// [...Array(num_users)].some(() => ({ ...options }));
			if(path.value.arguments[0].body && ![`ObjectExpression`].includes(path.value.arguments[0].body.type)) {
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
	// @todo This could be too generic. It can pick up methods that don't need await on them
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

		// Need to make sure to include expect here
		const checks = [...JS_BUILT_IN, ...EXCLUDE_OBJECTS, ...EXCLUDE_METHODS].filter(word => ![`expect`, `expectChai`].includes(word));

		// Exclude any built in javascipt functions
		if(checks.includes(path.value.callee.property.name) || checks.includes(path.value.callee.object.name)) {
			return path.value;
		}

		if(
			path.value.callee &&
			path.value.callee.object.callee &&
			checks.includes(path.value.callee.object.callee.name)
		) {
			return path.value;
		}

		// Exclude certing things like moment
		// Examples below:
		// current_date = moment(current_date, `MM/DD/YYYY`).add(1, `days`).format(`MM/DD/YYYY`);
		// dates.push(moment(current_date, `MM/DD/YYYY`).format(format_to_return));
		if(excludeAsyncCustom(path.value.callee.object)) {
			return path.value;
		}

		return {
			type     : `AwaitExpression`,
			argument : path.value
		}
	});

	// foo();
	root.find(j.CallExpression, {
		callee : {
			type : `Identifier`,
		}
	}).replaceWith(path => {
		const callee_name = path.value.callee.name;
		const checks      = [...JS_BUILT_IN, ...EXCLUDE_OBJECTS, ...HOOKS, ...[`$`, `$$`]];

		if(
			excludeAsyncWrap(path) ||
			insideExecute(path.parentPath) ||
			checks.includes(callee_name)
		) {
			return path.value;
		}

		return {
			type     : `AwaitExpression`,
			argument : path.value
		}
	});

	AWAIT_CUSTOM_GETTERS.forEach(name => {
		root.find(j.MemberExpression, {
			property : {
				name
			}
		}).replaceWith(path => {
			if(!path.value.object.name || excludeAsyncWrap(path)) {
				return path.value;
			}

			const object_start = path.value.object.name.charAt(0);

			// Check that the object starts with an uppercase character
			// If it's not uppercase it's likely not what we want
			if(object_start !== object_start.toUpperCase()) {
				return path.value;
			}

			return {
				type     : `AwaitExpression`,
				argument : path.value
			}
		});
	});

	root.find(j.MemberExpression, {
		property : {
			name : `selector`
		}
	}).replaceWith(path => {
		if(
			excludeAsyncWrap(path) ||
			(
				// Don't convert things like this.selector since it's likely not what we're looking for
				path.value.object && path.value.object.type === `ThisExpression`)
			) {
			return path.value;
		}

		return {
			type : `AwaitExpression`,
			argument : path.value
		}
	});

	// Set all method definitions to async. excludes "get", "set"
	root.find(j.MethodDefinition, {
		kind : `method`
	}).replaceWith(path => {
		if(EXCLUDE_METHODS.includes(path.value.key.name)) {
			return path.value;
		}

		path.value.value.async = true;

		return path.value;
	});

	// Set all method definitions to async. excludes "get", "set"
	// Needed for tsx
	root.find(j.ClassMethod, {
		kind : `method`
	}).replaceWith(path => {
		if(EXCLUDE_METHODS.includes(path.value.key.name)) {
			return path.value;
		}

		path.value.async = true;

		return path.value;
	});

	// Set all function definitions to async
	[`FunctionDeclaration`, `ArrowFunctionExpression`].forEach(name => {
		root.find(j[name]).replaceWith(path => {
			// Don't convert object literals
			// e.g. const foo = () => ({ bar : 123 });
			if(path.value.body.type === `ObjectExpression`) {
				return path.value;
			}

			// For ArrowFunctionExpression don't do things like:
			// describe()
			// But do:
			// const foo = () => {}
			if(path.parent.value.type === `CallExpression`) {
				return path.value;
			}

			path.value.async = true;

			return path.value;
		});
	});

	compilers.update(j, root, auto_compile_opts, opts);

	return root.toSource(opts.printOptions);
}
