class FriendsPage extends BasePage {
    constructor() {
        super();
        this.searchBox = element(by.model('search'));
        this.addnameBox = element(by.model('addName'));
        this.prevPageLink = element(by.buttonText('+ add'));
        this.actualCount = $('em.ng-binding');
        this.deleteButton = $('i.icon-trash');
        this.deleteButtons = $$('i.icon-trash');
        this.friendName = text => { return element.all(by.cssContainingText('td.ng-binding', text)); };
        // results...
        this.rows = element.all(by.repeater('row in rows'));

        this.url = 'angular/friends/';
        this.pageLoaded = this.isClickable($('h2.ng-binding'));
    }

    /**
     * non-angular login
     * @param  {string} user
     * @param  {string} pass
     * @return {promise}
     */
    login(user, pass) {
        this.addnameBox.setValue(user);
        this.actualCount.setValue(pass);
        console.log(this.searchBox);
        browser.call(() => {
            this.actualCount.setValue(pass);
        })
        return this.deleteButton.click();
    }

    foobar () {
        console.log(this.url)
    }

    /**
     * Page back till we find the post title
     * or run out of previous posts
     * @param  {string} postTitle
     * @return {bool}
     */
    async findPostByPaging(postTitle) {
        return await this.postTitleExists(postTitle).then(found => {
            if(found) {
                // found it!
                return true;
            } else {
                // prevPageLink not displayed on first page
                return this.prevPageLink.isPresent().then(async yup => {
                    if(yup) {
                        await this.prevPageLink.click();
                        await this.findPostByPaging(postTitle); // call recursively till found...
                        // wait for page to load...
                        await this.loaded();
                    } else {
                        // post not found
                        return false;
                    }
                });
            }
        });
    }
}
