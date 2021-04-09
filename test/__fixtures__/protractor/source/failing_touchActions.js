element(by.buttonTextSimple('Go!')).click();
element.all(by.buttonTextSimple('Go!'))[0].click();
element(by.css('#abc')).element(by.buttonTextSimple('Go!')).click();

browser.touchActions().
    tap(element1).
    doubleTap(element2).
    perform();

console.log('foo')
