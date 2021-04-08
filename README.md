WebdriverIO Codemod [![Test](https://github.com/webdriverio/protractor-codemod/actions/workflows/test.yaml/badge.svg)](https://github.com/webdriverio/protractor-codemod/actions/workflows/test.yaml)
===================

A codemod to transform test files into WebdriverIO tests. It can be used with [jscodeshift](https://www.npmjs.com/package/jscodeshift). Currently supported are:

- [x] Protractor
- __more will eventually follow, let us know which ones you would like to see__

## Install

To transform your spec files, you need to install the following packages:

```sh
$ npm install jscodeshift @wdio/codemod
```

## Usage

To transform you code, run:

```sh
$ npx jscodeshift -t ./node_modules/@wdio/codemod/<framework> <path>
# e.g. to transform Protractor code:
$ npx jscodeshift -t ./node_modules/@wdio/codemod/protractor ./e2e/
```
