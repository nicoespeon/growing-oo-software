import { Message } from "../../lib/xmpp";
import {
  AuctionEventListener,
  PriceSource,
} from "../domain/auction-event-listener";
import {
  AuctionMessageTranslator,
  FailureReporter,
} from "./auction-message-translator";

describe("AuctionMessageTranslator", () => {
  const UNUSED_CHAT = null;
  const SNIPER_ID = "Sniper ID";

  it("should notify auction closed when close message is received", () => {
    const message = new Message("SOL Version: 1.1; Event: CLOSE;");
    const listener = new FakeAuctionEventListener();
    const failureReporter = new FakeFailureReporter();
    const translator = new AuctionMessageTranslator(
      SNIPER_ID,
      listener,
      failureReporter
    );

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.auctionClosed).toBeCalled();
  });

  it("should notify bid details when current price message is received from other bidder", () => {
    const message = new Message(
      "SOL Version: 1.1; Event: PRICE; CurrentPrice: 192; Increment: 7; Bidder: Someone else;"
    );
    const listener = new FakeAuctionEventListener();
    const failureReporter = new FakeFailureReporter();
    const translator = new AuctionMessageTranslator(
      SNIPER_ID,
      listener,
      failureReporter
    );

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
    const failureReporter = new FakeFailureReporter();
    const translator = new AuctionMessageTranslator(
      SNIPER_ID,
      listener,
      failureReporter
    );

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.currentPrice).toBeCalledWith(
      192,
      7,
      PriceSource.FromSniper
    );
  });

  it("should notify auction failed when bad message is received", () => {
    const aBadMessage = "a bad message";
    const message = new Message(aBadMessage);
    const listener = new FakeAuctionEventListener();
    const failureReporter = new FakeFailureReporter();
    const translator = new AuctionMessageTranslator(
      SNIPER_ID,
      listener,
      failureReporter
    );

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.auctionFailed).toBeCalledTimes(1);
    expect(failureReporter.cannotTranslateMessage).toBeCalledTimes(1);
    expect(failureReporter.cannotTranslateMessage).toBeCalledWith(
      SNIPER_ID,
      aBadMessage,
      expect.any(Error)
    );
  });

  it("should notify auction failed when event type is missing", () => {
    const message = new Message(
      `SOL Version: 1.1; CurrentPrice: 234; Increment: 5; Bidder: ${SNIPER_ID};`
    );
    const listener = new FakeAuctionEventListener();
    const failureReporter = new FakeFailureReporter();
    const translator = new AuctionMessageTranslator(
      SNIPER_ID,
      listener,
      failureReporter
    );

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.auctionFailed).toBeCalledTimes(1);
  });
});

class FakeAuctionEventListener implements AuctionEventListener {
  auctionClosed = jest.fn();
  auctionFailed = jest.fn();
  currentPrice = jest.fn();
}

class FakeFailureReporter implements FailureReporter {
  cannotTranslateMessage = jest.fn();
}
