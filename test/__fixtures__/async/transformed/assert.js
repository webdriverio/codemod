describe('string methods and assert', () => {
    it('should not await String methods', async () => {
        const url = await browser.getUrl();
        if (url.startsWith('http')) { console.log(1) }
        const ok = url.endsWith('/');
        const padded = url.padStart(10, ' ').padEnd(20, ' ');
        const all = url.replaceAll('/', '_').repeat(2);
    });

    it('should await commands inside assert', async () => {
        assert.equal(await browser.getUrl(), base_url + '/#changesets', 'nav');
        assert.strictEqual(await $('.foo').getText(), 'bar');
        assert(await browser.getTitle());
    });
});
