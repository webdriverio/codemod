class FriendsPage extends BasePage {
    constructor() {
        super();
        this.friendName = text => { return $$("td.ng-binding=" + text); };

        this.url = 'angular/friends/';
    }

    get searchBox() {
        return $("*[ng-model=\"search\"]");
    }

    get addnameBox() {
        return $("*[ng-model=\"addName\"]");
    }

    get prevPageLink() {
        return $("button=+ add");
    }

    get actualCount() {
        return $('em.ng-binding');
    }

    get deleteButton() {
        return $('i.icon-trash');
    }

    get deleteButtons() {
        return $$('i.icon-trash');
    }

    get rows() {
        return $$("*[ng-repeat=\"row in rows\"]");
    }

    get pageLoaded() {
        return this.isClickable($('h2.ng-binding'));
    }

    /**
     * non-angular login
     * @param  {string} user
     * @param  {string} pass
     * @return {promise}
     */
    async login(user, pass) {
        (await this.addnameBox).setValue(user);
        (await this.actualCount).setValue(pass);
        console.log(await this.searchBox);
        browser.call(async () => {
            (await this.actualCount).setValue(pass);
        })
        return (await this.deleteButton).click();
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
        return await this.postTitleExists(postTitle).then(async found => {
            if(found) {
                // found it!
                return true;
            } else {
                // prevPageLink not displayed on first page
                return (await this.prevPageLink).isExisting().then(async yup => {
                    if(yup) {
                        await (await this.prevPageLink).click();
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
