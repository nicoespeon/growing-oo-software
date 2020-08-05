import { Message, Chat } from "./lib/xmpp";
import { AuctionEventListener } from "./auction-event-listener";

export { AuctionMessageTranslator };

class AuctionMessageTranslator {
  constructor(private listener: AuctionEventListener) {}

  processMessage(chat: Chat | null, message: Message) {
    const event = this.unpackEventFrom(message);

    switch (event.get("Event")) {
      case "CLOSE":
        this.listener.auctionClosed();
        break;

      case "PRICE":
        this.listener.currentPrice(
          parseInt(event.get("CurrentPrice") || "0"),
          parseInt(event.get("Increment") || "0")
        );
        break;
    }
  }

  private unpackEventFrom(message: Message): Map<string, string> {
    const event = new Map<string, string>();

    for (let element of message.body.split(";")) {
      const [key, value] = element.split(":");
      if (value) {
        event.set(key.trim(), value.trim());
      }
    }

    return event;
  }
}
