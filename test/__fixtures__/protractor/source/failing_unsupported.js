element(by.buttonTextSimple('Go!')).click();
element.all(by.buttonTextSimple('Go!'))[0].click();
element(by.css('#abc')).element(by.buttonTextSimple('Go!')).click();
browser.clearMockModules()
element(by.css('#abc')).elements(by.buttonTextSimple('Go!'))[0].click();
