// Add the custom locator.
browser.addLocatorStrategy('buttonTextSimple', function(buttonText, opt_parentElement) {
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
browser.custom$("buttonTextSimple", "Go!").click();
browser.custom$$("buttonTextSimple", "Go!")[0].click();
$('#abc').custom$("buttonTextSimple", "Go!").click();
$('#abc').custom$$("buttonTextSimple", "Go!")[0].click();
