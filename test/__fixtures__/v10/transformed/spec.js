browser.addCommand('myFn', fn, {
  attachToElement: true
})
browser.addCommand('other', fn, {
  attachToElement: false
})
browser.addCommand('already', fn, { attachToElement: true })
browser.overwriteCommand('click', fn, {
  attachToElement: true
})
browser.addCommand('withProto', fn, {
  attachToElement: true,
  proto: proto,
  instances: instances
})

await $('h1').getHTML({
  includeSelectorTag: false
})
await $('h1').getHTML({
  includeSelectorTag: true
})
await $('h1').getHTML({ includeSelectorTag: false })

await browser.getCookies({
  name: 'session'
})
await browser.getCookies({
  name: 'auth'
})
await browser.getCookies({
  name: 'session'
})
await browser.getCookies(['session', 'auth'])
await browser.getCookies({ name: 'kept' })
await browser.getCookies()
