browser.get(env.url + '/ng1/calculator');
element(by.model('first')).sendKeys(4);
element(by.id('gobutton')).click();
let list = element.all(by.css('.count span'));
element(by.cssContainingText('a', postTitle)).isPresent();
var dog = element.all(by.cssContainingText('.pet', 'Dog'));

element(by.css('#abc')).element(by.css('#def')).isPresent()
element(by.css('#abc')).isElementPresent(by.css('#def'))

browser.findElement(by.model('first')).sendKeys(4);
browser.findElements(by.id('gobutton'))[0].click();

firstNum.sendKeys('1');
browser.sleep(1000)
browser.explore()
browser.enterRepl()
const source = browser.getPageSource()
const url = browser.getCurrentUrl()
const url2 = browser.getLocationAbsUrl()
browser.executeScript(function() {console.error('error from test'); });

browser.wait(async () => {
    return await this.pageLoaded();
}, 3000, 'timeout');

;(async () => {
    await browser.getAllWindowHandles().then(handles => {
        browser.switchTo().window(handles[handles.length - 1])
        const a = 1 + 1
        console.log('test');
    })
    const b = 2 + 2
    await browser.getAllWindowHandles().then(handles => {
        browser.close();
        // the parent should be 2 less than the length of all found window handlers
        browser.switchTo().window(handles.length - 2);
    });

    const config = await browser.getProcessedConfig()
    await browser.getProcessedConfig().then((config) => {
        console.log(config);
    })
})

browser.switchTo().frame('composeWidget');
browser.close()
browser.restart()
browser.restartSync()

var foo = element(by.id('foo'));
foo.clear();
element(by.id('foo')).clear()
expect(foo.getId()).not.toBe(undefined);

browser.actions().sendKeys(protractor.Key.ARROW_DOWN).perform();
