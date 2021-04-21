import { browser, element, by, protractor } from "protractor";
const { browserB, elementB, byB, protractorB } = require('protractor')

browser.get(env.url + '/ng1/calculator', 12345);
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

;(async () => {
    const EC = protractor.ExpectedConditions;
    var button = $('#xyz');
    var isClickable = EC.elementToBeClickable(button);

    // You can define your own expected condition, which is a function that
    // takes no parameter and evaluates to a promise of a boolean.
    var urlChanged = function() {
        return browser.getCurrentUrl().then(function(url) {
            return url === 'http://www.angularjs.org';
        });
    };

    // You can customize the conditions with EC.and, EC.or, and EC.not.
    // Here's a condition to wait for url to change, $('abc') element to contain
    // text 'bar', and button becomes clickable.
    var condition = EC.and(urlChanged, EC.textToBePresentInElement($('abc'), 'bar'), isClickable);

    await browser.getAllWindowHandles().then(handles => {
        browser.switchTo().window(handles[handles.length - 1])
        const a = 1 + 1
        console.log('test');
    })
    const b = 2 + 2
    await browser.getAllWindowHandles().then(handles => {
        browser.close();
        // the parent should be 2 less than the length of all found window handlers
        browser.switchTo().window(handles[handles.length - 2]);
    });

    const config = await browser.getProcessedConfig()
    await browser.getProcessedConfig().then((config) => {
        console.log(config);
    })
    const windowLocation = await browser.manage().window().getPosition()
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

browser.wait(async () => {
    return await this.pageLoaded();
}, this.timeout.xl, 'timeout: waiting for page to load. The url is: ' + this.url)
browser.wait(async () => {
    return await this.pageLoaded();
}, 12345)

browser.manage().logs().get(logging.Type.BROWSER);

var row = element.all(by.repeater('dataRow in displayedCollection')).get(1);
var cells = row.all(by.tagName('td'));

var width = 800;
var height = 600;
browser.driver.manage().window().setSize(width, height);
browser.manage().deleteAllCookies();
