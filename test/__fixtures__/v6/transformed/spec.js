browser.newWindow('https://webdriver.io', {})
browser.newWindow('https://webdriver.io', {
    windowName: 'WebdriverIO window',
    windowFeature: 'width=420,height=230,resizable,scrollbars=yes,status=1'
})
browser.react$('t', {
    props: { name: '7' }
}).click()
browser.react$$('t', {
    props: { orange: true }
})
browser.waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, {
    timeout: 5000,
    timeoutMsg: 'expected text to be different after 5s'
});
