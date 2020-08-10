import { Connection as XMPPConnection, Chat } from "../../lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { Auction } from "../domain/auction";
import {
  AuctionEventListener,
  PriceSource,
} from "../domain/auction-event-listener";
import { XMPPFailureReporter } from "./xmpp-failure-reporter";

export { XMPPAuction };

class XMPPAuction implements Auction {
  static readonly AUCTION_RESOURCE = "Auction";
  private chat: Chat;

  constructor(private connection: XMPPConnection, itemId: string) {
    this.chat = connection
      .getChatManager()
      .createChat(
        `auction-${itemId}@${connection.serviceName}/${XMPPAuction.AUCTION_RESOURCE}`
      );
  }

  static joinCommandFormat = () => "SOL Version: 1.1; Event: JOIN;";
  static bidCommandFormat = (bid: number) =>
    `SOL Version: 1.1; Event: BID; Price: ${bid};`;

  addAuctionEventListener(listener: AuctionEventListener) {
    const auctionListeners = new AuctionListeners([listener]);
    const translator = new AuctionMessageTranslator(
      this.connection.user,
      auctionListeners,
      new XMPPFailureReporter()
    );
    auctionListeners.add(new ChatDisconnectedFor(translator, this.chat));

    this.chat.addMessageListener(translator);
  }

  bid(amount: number) {
    this.chat.sendMessage(XMPPAuction.bidCommandFormat(amount));
  }

  join() {
    this.chat.sendMessage(XMPPAuction.joinCommandFormat());
  }
}

class AuctionListeners implements AuctionEventListener {
  constructor(private listeners: AuctionEventListener[] = []) {}

  add(listener: AuctionEventListener) {
    this.listeners.push(listener);
  }

  auctionFailed() {
    this.listeners.forEach((listener) => listener.auctionFailed());
  }

  auctionClosed() {
    this.listeners.forEach((listener) => listener.auctionClosed());
  }

  currentPrice(price: number, increment: number, source: PriceSource) {
    this.listeners.forEach((listener) =>
      listener.currentPrice(price, increment, source)
    );
  }
}

class ChatDisconnectedFor implements AuctionEventListener {
  constructor(
    private translator: AuctionMessageTranslator,
    private chat: Chat
  ) {}

  auctionFailed() {
    this.chat.removeMessageListener(this.translator);
  }

  auctionClosed() {}
  currentPrice() {}
}
