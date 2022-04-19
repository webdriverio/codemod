const Login = require('./page');

describe('Test describe', () => {
    before(async () => {
        await Login.authenticate();
    });

    it('general commands', async () => {
        await Login.foo();

        await $('.foo').click();

        await browser.pause(5000);

        await browser.waitUntil(async () => {
            return (await $('.bar').getText()) === 'foo';
        });

        await foo();

        current_date = moment(current_date, `MM/DD/YYYY`).add(1, `days`).format(`MM/DD/YYYY`);
        dates.push(moment(current_date, `MM/DD/YYYY`).format(format_to_return));

        await Promise.all(foobar.map(String));

        await expect(1).toBe(1);

        const foobar = async () => {}

        const testing  = String(`foo`);
        const testing2 = `foo`.toUpperCase();
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

        const foo = await browser.execute(() => {
            $(`.foo`).click();
        });

        async function bar() {
            return browser.execute(() => {
                $(`.foo`).click();
            });
        }

        const results = await browser.execute(() => {
            const bar = 123;

            (function foo() {
                const testing = 456;
                foo();
            })()
        });

        testing = await browser.execute(() => {
            $(`.foo`).click();
        });
    });

    it('loops', async () => {
        for (const num of [1, 2, 3]) {
            await $('.foo').setValue(num);
        };

        await Promise.all([
            1,
            2,
            3
        ].map(async num => {
            await $('.foo').setValue(num);
        }));

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

        for (const num of foo) {
            await $('.bar').setValue('aaa');
        };

        for (const foo of button_data) {
            await checkAuthPage(true);
        };

        for (const [index, word] of [`foo`].entries()) {
            console.log(word, index);
        };

        for (const word of foo) {
            console.log(word);
        };

        for (const [index, word] of foo.entries()) {
            console.log(word, index);
        };

        for (const [index, word] of foo.bar.entries()) {
            console.log(word, index);
        };

        for (const word of foo.bar) {
            console.log(word);
        };

        for (const num of [`foo`]) {
            console.log(word);
        };

        await Promise.all((await $$(`.foo`)).map(async el => {
            await el.click();
        }));

        const bar = await Promise.all((await $$(`.foo`)).map(async el => {
            await el.click();
        }));
    });
});

async function foo() {
    const bar = 123;
    await $('.foo').setValue(bar);
}

const getColumns = async (foo, bar) => {
	await $(`.123`).setValue(123);
}

const foobar = () => ({
    foo : 123
});

async function requestAsync() {
  return new Promise(resolve => {
    request({
      url: 'https://api.github.com',
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
    }, (res) => resolve(res ? true : false));
  });
}