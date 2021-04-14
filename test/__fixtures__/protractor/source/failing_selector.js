expect(element(by.exactBinding('person.name')).isPresent()).toBe(true);
expect(element(by.exactBinding('person-email')).isPresent()).toBe(true);
expect(element(by.exactBinding('person')).isPresent()).toBe(false);
expect(element(by.exactBinding('person_phone')).isPresent()).toBe(true);
expect(element(by.exactBinding('person_phone|uppercase')).isPresent()).toBe(true);
expect(element(by.exactBinding('phone')).isPresent()).toBe(false);
