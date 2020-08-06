import { Message, Chat } from "./lib/xmpp";
import { AuctionEventListener, PriceSource } from "./auction-event-listener";

export { AuctionMessageTranslator };

class AuctionMessageTranslator {
  constructor(
    private readonly sniperId: string,
    private listener: AuctionEventListener
  ) {}

  processMessage(chat: Chat | null, message: Message) {
    const event = AuctionEvent.from(message.body);

    switch (event.type) {
      case "CLOSE":
        this.listener.auctionClosed();
        break;

      case "PRICE":
        this.listener.currentPrice(
          event.currentPrice,
          event.increment,
          event.isFrom(this.sniperId)
        );
        break;
    }
  }
}

class AuctionEvent {
  private fields = new Map<string, string>();

  get type(): string {
    return this.get("Event");
  }

  get currentPrice(): number {
    return this.getInt("CurrentPrice");
  }

  get increment(): number {
    return this.getInt("Increment");
  }

  isFrom(sniperId: string): PriceSource {
    return sniperId === this.bidder
      ? PriceSource.FromSniper
      : PriceSource.FromOtherBidder;
  }

  private get bidder(): string {
    return this.get("Bidder");
  }

  private getInt(fieldName: string): number {
    return parseInt(this.get(fieldName));
  }

  private get(fieldName: string): string {
    return this.fields.get(fieldName) || "";
  }

  static from(messageBody: string): AuctionEvent {
    const event = new AuctionEvent();

    for (let field of this.fieldsIn(messageBody)) {
      event.addField(field);
    }

    return event;
  }

  static fieldsIn(messageBody: string): string[] {
    return messageBody.split(";");
  }

  private addField(field: string) {
    const [key, value] = field.split(":");
    if (value) {
      this.fields.set(key.trim(), value.trim());
    }
  }
}
