browser.get(env.url + '/ng1/calculator');
element(by.model('first')).sendKeys(4);
element(by.id('gobutton')).click();
let list = element.all(by.css('.count span'));

expect(element(by.binding('latest')).getText()).toEqual('9');