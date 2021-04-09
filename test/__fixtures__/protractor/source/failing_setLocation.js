browser.get('http://angular.github.io/protractor/#/tutorial');
browser.setLocation('api');
expect(browser.getCurrentUrl())
    .toBe('http://angular.github.io/protractor/#/api');
