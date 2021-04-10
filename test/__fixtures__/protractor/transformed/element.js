$('.parent');
$('.parent');
browser.$('.parent');
browser.$('.parent');

// Using getDriver to find the parent web element to find the cat li
var liDog = $('.dog');
var liCat = liDog.parentElement().$('.cat');
var lis = liDog.parentElement().$$('li');
