browser.newWindow('https://webdriver.io')
browser.newWindow(
    'https://webdriver.io',
    'WebdriverIO window',
    'width=420,height=230,resizable,scrollbars=yes,status=1'
)
browser.react$('t', { name: '7' }).click()
browser.react$$('t', { orange: true })
browser.waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, 5000, 'expected text to be different after 5s');
