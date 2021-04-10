$('.parent').getWebElement();
element(by.css('.parent')).getWebElement();
browser.driver.findElement(by.css('.parent'));
browser.findElement(by.css('.parent'));

element(by.css('body')).allowAnimations(false);
$('body').allowAnimations(false);

// Using getDriver to find the parent web element to find the cat li
var liDog = element(by.css('.dog')).getWebElement();
var liCat = liDog.getDriver().findElement(by.css('.cat'));
var lis = liDog.getDriver().findElements(by.css('li'));
