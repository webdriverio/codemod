class FriendsPage {
    constructor() {
        this.binding = $('h2.ng-binding')
        this.pageLoaded = this.isClickable(this.binding);
    }
}
