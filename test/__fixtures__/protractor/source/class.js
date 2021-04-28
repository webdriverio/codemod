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
        this.names = element.all(by.repeater('row in rows').column('{{row}}'));

        this.url = 'angular/friends/';
        this.pageLoaded = this.isClickable($('h2.ng-binding'));
    }
}
