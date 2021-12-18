const Login = require('./page');

describe('Test describe', () => {
    before(() => {
        Authenticate.login();
    });

    it('testing general commands', () => {
        $('.foo').click();
        browser.pause(5000);
        browser.waitUntil(() => {
            return $('.bar').getText() === 'foo';
        });

        const arr = $$('.foo');

        browser.execute(() => {
            $('.foo').click();
        });

        browser.execute(() => {
            document.querySelector('.foo').click();
            $('.foo').click();
        });
    });

    it('testing loops', () => {
        [1,2,3].forEach(num => {
            $('.foo').setValue(num);
        });

        [
            1,
            2,
            3
        ].map(num => {
            $('.foo').setValue(num);
        });

        [
            {
                foo : 123,
                bar : 456,
            },
            {
                foo : 999,
                bar : 888,
            }
        ].forEach(({ foo, bar }) => {
            $('.foo').setValue(foo);
            $('.bar').setValue(bar);
        });

        foo.bar.forEach(num => {
            $('.bar').click();
        });

        foo.forEach(num => $('.bar').setValue('aaa'));

        button_data.forEach(checkAuthPage(true));
    });
});

function foo() {
    const bar = 123;
    $('.foo').setValue(bar);
}
