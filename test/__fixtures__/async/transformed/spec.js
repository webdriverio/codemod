const Login = require('./page');

describe('Test describe', () => {
    before(async () => {
        await Authenticate.login();
    });

    it('general commands', async () => {
        await $('.foo').click();

        await browser.pause(5000);

        await browser.waitUntil(async () => {
            return (await $('.bar').getText()) === 'foo';
        });

        foo();

        current_date = await (await moment(current_date, `MM/DD/YYYY`).add(1, `days`)).format(`MM/DD/YYYY`);
        dates.push(await moment(current_date, `MM/DD/YYYY`).format(format_to_return));
    });

    it(`browser.execute`, async () => {
        const arr = await $$('.foo');

        await browser.execute(() => {
            $('.foo').click();
        });

        await browser.execute(() => {
            document.querySelector('.foo').click();
            $('.foo').click();
        });

        await browser.execute(foo => {
            $(`.`).click();
            document.querySelector(`.foo`).click();
        }, `.foo`);

        await browser.execute(() => $(`.foo`).click());

        await browser.execute((date, time) => {
            const $date = $(`[data-title="Date Field"] .field-input.newdate`);
            const $time = $(`[data-title="Time Field"] .field-input.time`);
            $date.val(date);
            $time.val(time);
        }, date, time);

        await browser.execute(this.setHash(options.hash));
    });

    it('loops', async () => {
        for (const num of [1, 2, 3]) {
            await $('.foo').setValue(num);
        };

        [
            1,
            2,
            3
        ].map(async num => {
            await $('.foo').setValue(num);
        });

        for (const {
            foo,
            bar
        } of [{
            foo : 123,
            bar : 456,
        }, {
            foo : 999,
            bar : 888,
        }]) {
            await $('.foo').setValue(foo);
            await $('.bar').setValue(bar);
        };

        for (const num of foo.bar) {
            await $('.bar').click();
        };

        for (const num of foo) {
            await $('.bar').setValue('aaa');
        };

        for (const foo of button_data) {
            checkAuthPage(true);
        };
    });
});

async function foo() {
    const bar = 123;
    await $('.foo').setValue(bar);
}
