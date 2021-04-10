expect(
    element(
        by.css('person.name')
    ).getCssValue('color')
).toBe('#000000');
