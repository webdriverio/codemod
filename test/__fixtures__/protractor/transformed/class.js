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

    get addButton() {
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
}
