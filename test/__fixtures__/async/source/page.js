class Foo extends Page {
    open() {
        browser.url('https://webdriver.io');
    }

    login() {
        this.username.setValue('foo');
        this.password.setValue('bar');
        this.loginButton.click();
    }

    foo() {
        return $('.test');
    }

    static generateUsers(num_users, options = {}) {
        return [...Array(num_users)].map(() => ({ ...options }));
    }

    get username() { return $('foo'); }
    get password() { return $('bar'); }
    get bar() { return $$('bar'); }
}
