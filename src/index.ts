import { Connection as XMPPConnection } from "./lib/xmpp";
import { AuctionSniper } from "./auction-sniper";
import { XMPPAuction } from "./xmpp-auction";
import { SniperStateDisplayer } from "./sniper-state-displayer";

export { Main };

class Main {
  static readonly SNIPER_XMPP_ID = "Sniper 1245";

  static main(
    hostName: string,
    sniperUsername: string,
    sniperPassword: string,
    itemId: string
  ): void {
    const main = new Main();
    main.joinAuction(
      Main.connection(hostName, sniperUsername, sniperPassword),
      itemId
    );
  }

  private joinAuction(connection: XMPPConnection, itemId: string) {
    const auction = new XMPPAuction(connection, itemId);
    auction.addAuctionEventListener(
      new AuctionSniper(auction, new SniperStateDisplayer(itemId), itemId)
    );
    auction.join();
  }

  private static connection(
    hostName: string,
    username: string,
    password: string
  ): XMPPConnection {
    const connection = new XMPPConnection(hostName, Main.SNIPER_XMPP_ID);
    connection.connect();
    connection.login(username, password, XMPPAuction.AUCTION_RESOURCE);

    return connection;
  }
}
