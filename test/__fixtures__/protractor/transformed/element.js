$('.parent');
$('.parent');
browser.$('.parent');
browser.$('.parent');

(async () => {})();

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
