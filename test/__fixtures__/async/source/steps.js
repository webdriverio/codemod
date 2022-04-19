When('I click on the element {string}', (selector) => {
    $(selector).click();
});

When('I am open webDriverIO', () => {
    browser.url('https://webdriver.io');
});

Given(/^I switch to frame "([^"]*)?"$/, switchToFrame);

Then(
    /^I wait on element "([^"]*)?"(?: for (\d+)ms)*(?: to( not)* (be checked|be enabled|be selected|be displayed|contain a text|contain a value|exist|contain the text))*( "([^"]*)?")*$/,
    {
      wrapperOptions: {
        retry: 3,
      },
    },
    waitFor
);

After((scenario) => {
    if (scenario.result.status === 'SKIPPED') {
      return true;
    }

    if (scenario.result.status === 'PASSED' && failureObject === null) {
      return true;
    }
    console.log('Save a screenshot');
    browser.saveScreenshot(filePath);
});

Before({ tags: '@NotMandatory' }, () => {
    if (browser.params.featureContext === 'skip NotMandatory scenarios') {
      return 'skipped';
    }
    return true;
  });

BeforeStep((feat) => {
    const scenario = JSON.stringify(feat.pickle);
    if (scenario && (scenario.includes('endif') || scenario.includes('else'))) {
      return true;
    }
    if (browser.params.scenarioContext === 'skip next steps') {
      return 'skipped';
    }
    return true;
});