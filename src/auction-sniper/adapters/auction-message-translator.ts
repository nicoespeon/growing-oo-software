import { Message, Chat } from "../../lib/xmpp";
import {
  AuctionEventListener,
  PriceSource,
} from "../domain/auction-event-listener";

export { AuctionMessageTranslator, FailureReporter };

class AuctionMessageTranslator {
  constructor(
    private readonly sniperId: string,
    private listener: AuctionEventListener,
    private failureReporter: FailureReporter
  ) {}

  processMessage(_chat: Chat | null, message: Message) {
    try {
      this.translate(message);
    } catch (error) {
      this.failureReporter.cannotTranslateMessage(
        this.sniperId,
        message.body,
        error
      );
      return this.listener.auctionFailed();
    }
  }

  private translate(message: Message) {
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
    const value = this.fields.get(fieldName);

    if (!value) {
      throw new Error(`Value is missing for field "${fieldName}"`);
    }

    return value;
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
    } else if (key) {
      throw new Error(`Can't find value for key "${key}"`);
    }
  }
}

interface FailureReporter {
  cannotTranslateMessage: (
    auctionId: string,
    failedMessage: string,
    error: Error
  ) => void;
}
