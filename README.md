# Growing Object-Oriented Software, Guided by Tests

Implementation of the concrete example from the book, in TypeScript.

We're building an Auction Snipper that bids automatically on items.

## Glossary

- **Item** is something that can be identified and bought
- **Bidder** is a person or organization that is interested in buying an item
- **Bid** is a statement that a bidder will pay at a given price for an item
- **Current price** is the current higgest bid for the item
- **Stop price** is the ost a bidder is prepared to pay for an item
- **Auction** is a process for managing bids for an item
- **Auction house** is an institution that hosts auctions

## Differences with original example in Java

### `lib/` content

The original example was in Java. Java provides a lot of concepts in its standard library.

For concepts I couldn't find in the JavaScript world, I implemented "just enough" capabilities and put that logic in the `lib/` folder. These scripts could be deployed as external libraries and installed as packages.

However, I still find it interesting to have an adapter between what an external library would provide and the API we want to use in the rest of the application.

### CLI output

The original example used Java Spring capabilities to make the application run. In JS, that's different.

I didn't want to set up a server & a client, then to rely on the browser. Therefore, I kept it closer to the original implementation by implementing a CLI output instead. That's valid Node.js, it looks much like the Java example, so that should do it 👍
