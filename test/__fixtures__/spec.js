browser.get(env.url + '/ng1/calculator');
$("*[ng-model=\"first\"]").sendKeys(4);
$("#gobutton").click();
let list = $$('.count span');

expect(element(by.binding('latest')).getText()).toEqual('9');