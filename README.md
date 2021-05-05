WebdriverIO Codemod [![Test](https://github.com/webdriverio/protractor-codemod/actions/workflows/test.yaml/badge.svg)](https://github.com/webdriverio/protractor-codemod/actions/workflows/test.yaml)
===================

This project contains various codemods to help migrating from either one major WebdriverIO version to another or from a specific framework to WebdriverIO. It can be used with [jscodeshift](https://www.npmjs.com/package/jscodeshift) and currently supports the following migrations:

- [x] v5 ▶️&nbsp; v6 (see [migration guide](https://webdriver.io/docs/v6-migration))
- [x] v6 ▶️&nbsp; v7 (see [migration guide](https://webdriver.io/docs/v7-migration))
- [x] Protractor ▶️&nbsp; WebdriverIO (see [migration guide](https://webdriver.io/docs/protractor-migration))
- [ ] _more will eventually follow, let us know which ones you would like to see_

If you run into any issues during your migration please [let us know](https://github.com/webdriverio/codemod/discussions/new).

## Install

To transform your spec files, you need to install the following packages:

```sh
$ npm install jscodeshift @wdio/codemod
```

## Usage

To transform you code, run:

```sh
$ npx jscodeshift -t ./node_modules/@wdio/codemod/<framework> <path>
# e.g. to migrate from v5 to v6
$ npx jscodeshift -t ./node_modules/@wdio/codemod/v6 ./e2e/
# e.g. to migrate from v6 to v7:
$ npx jscodeshift -t ./node_modules/@wdio/codemod/v7 ./e2e/
# e.g. to transform Protractor code:
$ npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./e2e/
```

If you use TypeScript make sure you apply a different parser as parameter, e.g.:

```sh
$ npx jscodeshift -t ./node_modules/@wdio/codemod/protractor --parser=tsx ./e2e/*.ts
```

You can transform tests as well as config files, e.g.:

![Codemod Usage Example][example]

[example]: /.github/assets/example.gif "Codemod Usage Example"
