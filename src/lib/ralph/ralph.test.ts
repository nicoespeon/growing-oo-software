describe("Creates a builder", () => {
  it("that can build default object", () => {
    const aBuilder = createBuilderFrom({ firstName: "John", lastName: "Doe" });
    const result = aBuilder().build();

    expect(result).toEqual({ firstName: "John", lastName: "Doe" });
  });

  it("that has methods to override defaults", () => {
    const aPerson = createBuilderFrom({
      firstName: "John",
      lastName: "Doe",
    });
    const person = aPerson().with("firstName", "Jane").build();

    expect(person).toEqual({ firstName: "Jane", lastName: "Doe" });

    const aDate = createBuilderFrom({ month: 12, day: 2 });
    const date = aDate().with("month", 4).build();

    expect(date).toEqual({ month: 4, day: 2 });
  });

  it("that has a method to fork", () => {
    const anAddress = createBuilderFrom({
      street: "Default street",
      city: "Default City",
      lat: 0,
      lon: 0,
    });
    const anAddressInLondon = anAddress().with("city", "London");

    const addressWithStreet = anAddressInLondon
      .but()
      .with("street", "221b Baker Street")
      .build();
    const addressWithCoordinates = anAddressInLondon
      .but()
      .with("lat", 12.2387)
      .with("lon", -1.8474)
      .build();

    expect(addressWithStreet.street).toBe("221b Baker Street");
    expect(addressWithStreet.lat).toBe(0);
    expect(addressWithStreet.lon).toBe(0);

    expect(addressWithCoordinates.street).toBe("Default street");
    expect(addressWithCoordinates.lat).toBe(12.2387);
    expect(addressWithCoordinates.lon).toBe(-1.8474);
  });

  it("that automatically build given builders", () => {
    const aPostCode = createBuilderFrom({ first: "000", last: "000" });
    const anAddress = createBuilderFrom({
      street: "Default street",
      city: "Default City",
      postCode: aPostCode().build(),
    });

    const address = anAddress()
      .with("postCode", aPostCode().with("first", "NR1").with("last", "YX4"))
      .build();

    expect(address.postCode).toEqual({ first: "NR1", last: "YX4" });
  });
});

const template = {
  id: "id",
  event_code: "AUTHORISATION",
  event_date: new Date(),
  adyen_psp_reference: "adyen_psp_reference",
  merchant_account_code: null,
  purchase_id: null,
  success: true,
  processed_at: null,
  busbud_error: null,
  created_at: new Date(),
  updated_at: new Date(),
  // TODO: be able to create a builder that modifies nested data with convenient method
  notification_data: {
    NotificationRequestItem: {
      additionalData: {
        hmacSignature: "hmacSignature",
      },
      amount: {
        value: 1000,
        currency: "CAD",
      },
      originalReference: "originalReference",
      pspReference: "pspReference",
      eventCode: "AUTHORISATION",
      eventDate: "eventDate",
      merchantAccountCode: "merchantAccountCode",
      success: "success",
    },
  },
};

function createBuilderFrom<Template extends AnyObject>(
  template: Template
): () => Builder<Template> {
  return () => {
    const templateCopy = Object.assign({}, template);

    const builder: Builder<Template> = {
      with(key, value) {
        templateCopy[key] = isBuilder(value) ? value.build() : value;
        return builder;
      },

      but() {
        return createBuilderFrom(builder.build())();
      },

      build() {
        return templateCopy;
      },
    };

    return builder;
  };
}

function isBuilder<K, T>(candidate: K | Builder<T>): candidate is Builder<T> {
  // @ts-ignore The point of this type guard is to check if candidate has build()
  return candidate && typeof candidate.build === "function";
}

type Builder<Template> = {
  with<Key extends keyof Template>(
    key: Key,
    value: Template[Key] | Builder<Template[Key]>
  ): Builder<Template>;
  build: () => Template;
  but: () => Builder<Template>;
};

type AnyObject = { [k: string]: any };
