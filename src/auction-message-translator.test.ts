import { Message } from "./lib/xmpp";
import { AuctionEventListener } from "./auction-event-listener";
import { AuctionMessageTranslator } from "./auction-message-translator";

describe("AuctionMessageTranslator", () => {
  const UNUSED_CHAT = null;

  it("should notify auction closed when it receives close message", () => {
    const message = new Message("SOL Version: 1.1; Event: CLOSE;");
    const listener = new FakeAuctionEventListener();
    const translator = new AuctionMessageTranslator(listener);

    translator.processMessage(UNUSED_CHAT, message);

    expect(listener.auctionClosed).toBeCalled();
  });
});

class FakeAuctionEventListener implements AuctionEventListener {
  auctionClosed = jest.fn();
}
