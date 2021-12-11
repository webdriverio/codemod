const compilers            = require(`../common/compilers`);
const { ELEMENT_COMMANDS } = require(`../common/constants`);
const {
	EXTRA_COMMANDS,
	METHODS,
	HOOKS
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


	// Transforms element commands and methods to add await to the beginning
	root.find(j.CallExpression).replaceWith(path => {
		if(excludeAsyncWrap(path)) {
			return path.value;
		}

		const element_check = path.value.callee.property;
		const method_check  = path.value.callee && path.value.callee.object && path.value.callee.object.callee;
		const extra_check   = path.value.callee && path.value.callee.object && path.value.callee.object.object && path.value.callee.object.object.callee;

		if(!element_check && !method_check && !extra_check) {
			return path.value;
		}

		const element_command = element_check ? path.value.callee.property.name : null;
		const method          = method_check ? path.value.callee.object.callee.name : (extra_check ? path.value.callee.object.object.callee.name : null);

		if(![...ELEMENT_COMMANDS, ...EXTRA_COMMANDS].includes(element_command) && !METHODS.includes(method)) {
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
