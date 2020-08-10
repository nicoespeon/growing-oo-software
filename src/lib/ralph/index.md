# Build it Ralph!

This is a playground to implement a factory that would create builders as depicted in the book, in TypeScript.

There are some builders in the TS world, but none actually provide a similar API and abstraction level as described.

## Examples of what we'd like to achieve

### Domain

```js
interface Address {
  street: string;
  city: string;
  postCode: PostCode;
  lat: number;
  lon: number;
  some: string;
  canBeDefaulted: boolean;
}

interface PostCode {
  first: string;
  last: string;
}
```

### What people use to do

```js
const aLongerAddress: Address = {
  street: "221b Baker Street",
  city: "London",
  postCode: {
    first: "NW1",
    last: "3RX",
  },
  lat: 12.2387,
  lon: -1.8474,
  some: "useless information",
  canBeDefaulted: true,
};
```

### Doing it manually

Basic concept of builders, with types.

```js
const aLongerAddress = new AddressBuilder()
  .withStreet("221b Baker Street")
  .withCity("London")
  .withPostCode(new PostCodeBuilder("NW1", "3RX").build())
  .build();

class AddressBuilder {
  withStreet(street: Address["street"]): this {
    return this;
  }
  withCity(city: Address["city"]): this {
    return this;
  }
  withPostCode(postCode: Address["postCode"]): this {
    return this;
  }
  withLat(lat: Address["lat"]): this {
    return this;
  }
  withLon(lon: Address["lon"]): this {
    return this;
  }
  with(postCode: PostCodeBuilder): this {
    return this;
  }
  but(): this {
    return this;
  }
  build(): Address {
    return {
      street: "221b Baker Street",
      city: "London",
      postCode: {
        first: "NW1",
        last: "3RX",
      },
      lat: 12.2387,
      lon: -1.8474,
      some: "useless information",
      canBeDefaulted: true,
    };
  }
}

function anAddress() {
  return new AddressBuilder();
}

class PostCodeBuilder {
  constructor(
    private first: PostCode["first"],
    private last: PostCode["last"]
  ) {}

  build(): PostCode {
    return {
      first: this.first,
      last: this.last,
    };
  }
}

function aPostCode(first: string, last: string) {
  return new PostCodeBuilder(first, last);
}
```

### The Goal

- Factories
- Type safe based on the interface
- API based on the interface
- `.but()`

```js
const anAddressInLondon = anAddress()
  .withCity("London")
  .withPostCode(aPostCode("NW1", "3RX").build());

const anAddressWithStreet = anAddressInLondon3
  .but()
  .withStreet("221b Baker Street")
  .build();
const addressWithCoordinates = anAddressInLondon3
  .but()
  .withLat(12.2387)
  .withLon(-1.8474)
  .build();
```

### The dream

- No need to call build()
- Automatic inference of builder in with()

```js
const aLongerAddress = anAddress()
  .withStreet("221b Baker Street")
  .withCity("London")
  .with(aPostCode("NW1", "3RX"))
  .build();
```

## TODOs

- [x] Factory from object
- [x] API based on interface (using `.with("city", "london")`)
- [x] Type safe based on interface
- [x] `.but()` to fork
- [x] Automatically build given builders
- [ ] Handle nested structure with an abstraction (e.g. data.NotifRequest.body)
- [ ] Have a buildList() that returns T[]
- [ ] Ability to provide higher-level abstractions like `withNoPostCode()`
- [ ] Ability to prevent some withX() methods to be generated (to preserve abstraction)
- [ ] Possible to pass attributes in constructor too
