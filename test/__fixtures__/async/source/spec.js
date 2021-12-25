const Login = require('./page');

describe('Test describe', () => {
    before(() => {
        Authenticate.login();
    });

    it('general commands', () => {
        $('.foo').click();

        browser.pause(5000);

        browser.waitUntil(() => {
            return $('.bar').getText() === 'foo';
        });

        foo();

        current_date = moment(current_date, `MM/DD/YYYY`).add(1, `days`).format(`MM/DD/YYYY`);
        dates.push(moment(current_date, `MM/DD/YYYY`).format(format_to_return));
    });

    it(`browser.execute`, () => {
        const arr = $$('.foo');

        browser.execute(() => {
            $('.foo').click();
        });

        browser.execute(() => {
            document.querySelector('.foo').click();
            $('.foo').click();
        });

        browser.execute(foo => {
            $(`.`).click();
            document.querySelector(`.foo`).click();
        }, `.foo`);

        browser.execute(() => $(`.foo`).click());

        browser.execute((date, time) => {
            const $date = $(`[data-title="Date Field"] .field-input.newdate`);
            const $time = $(`[data-title="Time Field"] .field-input.time`);
            $date.val(date);
            $time.val(time);
        }, date, time);

        browser.execute(this.setHash(options.hash));
    });

    it('loops', () => {
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
