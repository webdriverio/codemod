// Dragging one element to another.
browser.actions().
    mouseDown(element1).
    mouseMove(element2).
    mouseUp().
    perform();

// You can also use the `dragAndDrop` convenience action.
browser.actions().
    dragAndDrop(element1, element2).
    perform();

// Instead of specifying an element as the target, you can specify an offset
// in pixels. This example double-clicks slightly to the right of an element.
browser.actions().
    mouseMove(element).
    mouseMove({x: 50, y: 0}).
    doubleClick().
    perform();
