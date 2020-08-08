import { Connection as XMPPConnection } from "./lib/xmpp";
import { XMPPAuction } from "./xmpp-auction";
import { Auction, AuctionHouse } from "./auction";

export class XMPPAuctionHouse implements AuctionHouse {
  static readonly SNIPER_XMPP_ID = "Sniper 1245";

  constructor(private connection: XMPPConnection) {}

  static connect(
    hostName: string,
    username: string,
    password: string
  ): XMPPAuctionHouse {
    const connection = new XMPPConnection(hostName, this.SNIPER_XMPP_ID);
    connection.connect();
    connection.login(username, password, XMPPAuction.AUCTION_RESOURCE);

    return new XMPPAuctionHouse(connection);
  }

  auctionFor(itemId: string): Auction {
    return new XMPPAuction(this.connection, itemId);
  }
}
