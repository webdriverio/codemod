browser.newWindow('https://webdriver.io')
browser.newWindow(
    'https://webdriver.io',
    'WebdriverIO window',
    'width=420,height=230,resizable,scrollbars=yes,status=1'
)
browser.react$('t', { name: '7' }).click()
browser.react$$('t', { orange: true })
$('foo').react$('t', { name: '7' }).click()
$('foo').react$$('t', { orange: true })
browser.waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, 5000, 'expected text to be different after 5s');

$('elem').waitUntil(() => {
    return $('#someText').getText() === 'I am now different'
}, 5000, 'expected text to be different after 5s');

// drag and drop to other element
elem.dragAndDrop(target, 100)

// drag and drop relative from current position
elem.dragAndDrop({ x: 100, y: 200 }, 123)

$('#selector').moveTo(123, 321)

elem.waitForDisplayed(123, false, 'foobar', 321)
elem.waitForDisplayed(undefined, true);
elem.waitForEnabled(3000, true, new Error('foobar'))
elem.waitForExist(3000, true, new Error('foobar'))
