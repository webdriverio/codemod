$('.parent').getWebElement();
element(by.css('.parent')).getWebElement();
browser.driver.findElement(by.css('.parent'));
browser.findElement(by.css('.parent'));

element(by.css('body')).allowAnimations(false);
$('body').allowAnimations(false);

(async () => {
    await $('body').allowAnimations(false);
    await this.deleteButtons.get(0).click();
    await this.deleteButton.setValue('Some text...');
    await (await this.deleteButton).setValue('Some text...');
    expect(await searchPage.noResultsMsg.isDisplayed()).toBe(true);
    expect(await (await loginPage.errorMessage).isDisplayed()).toBe(true);
    expect(await (await loginPage.errorMessages)[0].isDisplayed()).toBe(true);
})();

// Using getDriver to find the parent web element to find the cat li
var liDog = element(by.css('.dog')).getWebElement();
var liCat = liDog.getDriver().findElement(by.css('.cat'));
var lis = liDog.getDriver().findElements(by.css('li'));

var li = element(by.xpath('//ul/li/a'));
expect(element(by.tagName('a')).getText()).toBe('Google');
var doge = element(by.partialLinkText('Doge'));
var dog = element(by.name('dog_name'));
var wideElement = element(by.js(function() {
    var spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; ++i) {
        if (spans[i].offsetWidth > 100) {
            return spans[i];
        }
    }
}));
expect(element(by.linkText('Google')).getTagName()).toBe('a');
var allOptions = element.all(by.options('c for c in colors'));
element(by.partialButtonText('Save'));
element(by.buttonText('Save'));

let list = element.all(by.css('.items li'));
expect(list.count()).toBe(3);

const loc = "file-submit";
// element(by.id(loc));
element(by.id(loc));
// element(by.xpath(loc));
element(by.xpath(loc));
// element(by.name(loc));
element(by.name(loc));
// element(by.model(loc));
element(by.model(loc));
// element(by.repeater(loc));
element(by.repeater(loc));
// element(by.linkText(loc));
element(by.linkText(loc));
// element(by.partialLinkText(loc));
element(by.partialLinkText(loc));
// element(by.className(loc));
element(by.className(loc));
// element(by.tagName(loc));
element(by.tagName(loc));
// element(by.options(loc));
element(by.options(loc));
// element(by.buttonText(loc));
element(by.buttonText(loc));
// element(by.partialButtonText(loc));
element(by.partialButtonText(loc));
