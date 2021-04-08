browser.get(env.url + '/ng1/calculator');
element(by.model('first')).sendKeys(4);
element(by.id('gobutton')).click();
let list = element.all(by.css('.count span'));
element(by.cssContainingText('a', postTitle)).isPresent();
var dog = element.all(by.cssContainingText('.pet', 'Dog'));

firstNum.sendKeys('1');
browser.sleep(1000)
browser.explore()
browser.enterRepl()
const source = browser.getPageSource()
const url = browser.getCurrentUrl()
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
})