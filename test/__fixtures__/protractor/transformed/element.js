$('.parent');
$('.parent');
browser.$('.parent');
browser.$('.parent');

(async () => {
    await (await this.deleteButtons)[0].click();
    await (await this.deleteButton).setValue('Some text...');
    await (await this.deleteButton).setValue('Some text...');
    expect(await (await searchPage.noResultsMsg).isDisplayed()).toBe(true);
    expect(await (await loginPage.errorMessage).isDisplayed()).toBe(true);
    expect(await (await loginPage.errorMessages)[0].isDisplayed()).toBe(true);
})();

// Using getDriver to find the parent web element to find the cat li
var liDog = $('.dog');
var liCat = liDog.parentElement().$('.cat');
var lis = liDog.parentElement().$$('li');

var li = $('//ul/li/a');
expect($('a').getText()).toBe('Google');
var doge = $("*=Doge");
var dog = $("*[name=\"dog_name\"]");
var wideElement = $(function() {
    var spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length; ++i) {
        if (spans[i].offsetWidth > 100) {
            return spans[i];
        }
    }
});
expect($("=Google").getTagName()).toBe('a');
var allOptions = $$("select[ng-options=\"c for c in colors\"] option");
$("button*=Save");
$("button=Save");

let list = $$('.items li');
expect(list.length).toBe(3);

const loc = "file-submit";
// element(by.id(loc));
$(`#${loc}`);
// element(by.xpath(loc));
$(loc);
// element(by.name(loc));
$(`*[name="${loc}"]`);
// element(by.model(loc));
$(`*[ng-model="${loc}"]`);
// element(by.repeater(loc));
$(`*[ng-repeat="${loc}"]`);
// element(by.linkText(loc));
$(`=${loc}`);
// element(by.partialLinkText(loc));
$(`*=${loc}`);
// element(by.className(loc));
$(`.${loc}`);
// element(by.tagName(loc));
$(loc);
// element(by.options(loc));
$(`select[ng-options="${loc}"] option`);
// element(by.buttonText(loc));
$(`button=${loc}`);
// element(by.partialButtonText(loc));
$(`button*=${loc}`);
