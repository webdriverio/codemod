var EC = protractor.ExpectedConditions;
var button = $('#xyz');
var isClickable = EC.elementToBeClickable(button);

browser.get(URL);
browser.wait(isClickable, 5000); //wait for an element to become clickable
button.click();

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
var condition = EC.and(urlChanged, EC.textToBePresentInElement($('abc'),
'bar'), isClickable);
browser.get(URL);
browser.wait(condition, 5000); //wait for condition to be true.
button.click();
