const Login = require('./page');

describe('Test describe', () => {
    before(() => {
        Login.authenticate();
    });

    it('general commands', () => {
        Login.foo();

        $('.foo').click();

        browser.pause(5000);

        browser.waitUntil(() => {
            return $('.bar').getText() === 'foo';
        });

        foo();

        current_date = moment(current_date, `MM/DD/YYYY`).add(1, `days`).format(`MM/DD/YYYY`);
        dates.push(moment(current_date, `MM/DD/YYYY`).format(format_to_return));

        foobar.map(String);

        expect(1).toBe(1);

        const foobar = () => {}

        const testing  = String(`foo`);
        const testing2 = `foo`.toUpperCase();
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

        const foo = browser.execute(() => {
            $(`.foo`).click();
        });

        function bar() {
            return browser.execute(() => {
                $(`.foo`).click();
            });
        }

        const results = browser.execute(() => {
            const bar = 123;

            (function foo() {
                const testing = 456;
                foo();
            })()
        });

        testing = browser.execute(() => {
            $(`.foo`).click();
        });
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

        foo.forEach(num => $('.bar').setValue('aaa'));

        button_data.forEach(checkAuthPage(true));

        [`foo`].forEach((word, index) => {
            console.log(word, index);
        });

        foo.forEach((word) => {
            console.log(word);
        });

        foo.forEach((word, index) => {
            console.log(word, index);
        });

        foo.bar.forEach((word, index) => {
            console.log(word, index);
        });

        foo.bar.forEach(word => {
            console.log(word);
        });

        [`foo`].forEach(num => {
            console.log(word);
        });

        $$(`.foo`).map((el) => {
            el.click();
        });

        const bar = $$(`.foo`).map((el) => {
            el.click();
        });
    });
});

function foo() {
    const bar = 123;
    $('.foo').setValue(bar);
}

const getColumns = (foo, bar) => {
	$(`.123`).setValue(123);
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