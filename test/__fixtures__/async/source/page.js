class Foo extends Page {
    open() {
        browser.url('https://webdriver.io')
    }

    login() {
        this.username.setValue('foo')
        this.password.setValue('bar')
        this.loginButton.click()
    }

    foo() {
        return $('.test')
    }

    get username() { return $('foo') }
    get password() { return $('bar') }
}
