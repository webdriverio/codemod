class FriendsPage {
    constructor() {
        this.binding = element(by.css('h2.ng-binding'))
        this.pageLoaded = this.isClickable(this.binding);
    }
}
