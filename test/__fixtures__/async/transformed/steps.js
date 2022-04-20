When('I click on the element {string}', async selector => {
    await $(selector).click();
});

When('I am open webDriverIO', async () => {
    await browser.url('https://webdriver.io');
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

After(async scenario => {
    if (scenario.result.status === 'SKIPPED') {
      return true;
    }

    if (scenario.result.status === 'PASSED' && failureObject === null) {
      return true;
    }
    console.log('Save a screenshot');
    await browser.saveScreenshot(filePath);
});

Before({ tags: '@NotMandatory' }, async () => {
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