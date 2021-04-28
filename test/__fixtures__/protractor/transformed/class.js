class FriendsPage extends BasePage {
    constructor() {
        super();
        this.friendName = text => { return $$("td.ng-binding=" + text); };
        this.names = element.all(by.repeater('row in rows').column('{{row}}'));

        this.url = 'angular/friends/';
        this.pageLoaded = this.isClickable($('h2.ng-binding'));
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
}
