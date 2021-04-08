browser.url(env.url + '/ng1/calculator');
$("*[ng-model=\"first\"]").setValue(4);
$("#gobutton").click();
let list = $$('.count span');
$("a=" + postTitle).isPresent();
var dog = $$(".pet=Dog");

firstNum.setValue('1');
browser.pause(1000)
browser.debug()
browser.debug()
const source = browser.getSource()
const url = browser.getUrl()
browser.execute(function() {console.error('error from test'); });

browser.waitUntil(async () => {
    return await this.pageLoaded();
}, 3000, 'timeout');

;(async () => {
    let handles = await browser.getWindowHandles();
    browser.switchTo().window(handles[handles.length - 1])
    const a = 1 + 1
    console.log('test');
    const b = 2 + 2
    let handles = await browser.getWindowHandles();
    browser.close();
    // the parent should be 2 less than the length of all found window handlers
    browser.switchTo().window(handles.length - 2);
})