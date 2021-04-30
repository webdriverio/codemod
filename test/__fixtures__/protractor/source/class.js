class FriendsPage extends BasePage {
    constructor() {
        super();
        this.searchBox = element(by.model('search'));
        this.addnameBox = element(by.model('addName'));
        this.addButton = element(by.buttonText('+ add'));
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
        return this.deleteButton.click();
    }

    foobar () {
        console.log(this.url)
    }
}
