import { Message, Chat } from "./lib/xmpp";
import { AuctionEventListener } from "./auction-event-listener";

export { AuctionMessageTranslator };

class AuctionMessageTranslator {
  constructor(private listener: AuctionEventListener) {}

  processMessage(chat: Chat | null, message: Message) {
    this.listener.auctionClosed();
  }
}
