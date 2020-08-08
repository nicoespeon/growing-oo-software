import { Connection as XMPPConnection, Chat } from "../lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { Auction } from "../domain/auction";
import { AuctionEventListener } from "../domain/auction-event-listener";

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

  static joinCommandFormat = () => "SOL Version: 1.1; Command: JOIN;";
  static bidCommandFormat = (bid: number) =>
    `SOL Version: 1.1; Command: BID; Price: ${bid};`;

  addAuctionEventListener(listener: AuctionEventListener) {
    this.chat.addMessageListener(
      new AuctionMessageTranslator(this.connection.user, listener)
    );
  }

  bid(amount: number) {
    this.chat.sendMessage(XMPPAuction.bidCommandFormat(amount));
  }

  join() {
    this.chat.sendMessage(XMPPAuction.joinCommandFormat());
  }
}
