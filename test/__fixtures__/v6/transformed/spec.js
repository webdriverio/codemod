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
$('foo').react$('t', {
    props: { name: '7' }
}).click()
$('foo').react$$('t', {
    props: { orange: true }
})
browser.waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, {
    timeout: 5000,
    timeoutMsg: 'expected text to be different after 5s'
});

$('elem').waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, {
    timeout: 5000,
    timeoutMsg: 'expected text to be different after 5s'
});

// drag and drop to other element
elem.dragAndDrop(target, {
    duration: 100
})

// drag and drop relative from current position
elem.dragAndDrop({ x: 100, y: 200 }, {
    duration: 123
})

$('#selector').moveTo({
    xOffset: 123,
    yOffset: 321
})

elem.waitForDisplayed({
    timeout: 123,
    reverse: false,
    timeoutMsg: 'foobar',
    interval: 321
})
elem.waitForDisplayed({
    reverse: true
});
elem.waitForEnabled({
    timeout: 3000,
    reverse: true,
    timeoutMsg: new Error('foobar')
})
elem.waitForExist({
    timeout: 3000,
    reverse: true,
    timeoutMsg: new Error('foobar')
})
