// Add the custom locator.
by.addLocator('buttonTextSimple',
    function(buttonText, opt_parentElement) {
  // This function will be serialized as a string and will execute in the
  // browser. The first argument is the text for the button. The second
  // argument is the parent element, if any.
  var using = opt_parentElement || document,
      buttons = using.querySelectorAll('button');

  // Return an array of buttons with the text.
  return Array.prototype.filter.call(buttons, function(button) {
    return button.textContent === buttonText;
  });
});

// Use the custom locator.
element(by.buttonTextSimple('Go!')).click();
element.all(by.buttonTextSimple('Go!'))[0].click();
element(by.css('#abc')).element(by.buttonTextSimple('Go!')).click();
element(by.css('#abc')).elements(by.buttonTextSimple('Go!'))[0].click();