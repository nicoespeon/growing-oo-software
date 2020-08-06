import { Message } from "./lib/xmpp";
import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { AuctionMessageTranslator } from "./auction-message-translator";

describe("AuctionMessageTranslator", () => {
  const UNUSED_CHAT = null;
  const SNIPER_ID = "Sniper ID";

  it("should notify auction closed when close message is received", () => {
    const message = new Message("SOL Version: 1.1; Event: CLOSE;");
    const listener = new FakeAuctionEventListener();
    const translator = new AuctionMessageTranslator(SNIPER_ID, listener);

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.auctionClosed).toBeCalled();
  });

  it("should notify bid details when current price message is received from other bidder", () => {
    const message = new Message(
      "SOL Version: 1.1; Event: PRICE; CurrentPrice: 192; Increment: 7; Bidder: Someone else;"
    );
    const listener = new FakeAuctionEventListener();
    const translator = new AuctionMessageTranslator(SNIPER_ID, listener);

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.currentPrice).toBeCalledWith(
      192,
      7,
      PriceSource.FromOtherBidder
    );
  });

  it("should notify bid details when current price message is received from sniper", () => {
    const message = new Message(
      `SOL Version: 1.1; Event: PRICE; CurrentPrice: 192; Increment: 7; Bidder: ${SNIPER_ID};`
    );
    const listener = new FakeAuctionEventListener();
    const translator = new AuctionMessageTranslator(SNIPER_ID, listener);

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.currentPrice).toBeCalledWith(
      192,
      7,
      PriceSource.FromSniper
    );
  });
});

class FakeAuctionEventListener implements AuctionEventListener {
  auctionClosed = jest.fn();
  currentPrice = jest.fn();
}
