import { Connection as XMPPConnection, Chat } from "./lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { SniperSnapshot } from "./sniper-snapshot";
import { AuctionEventListener } from "./auction-event-listener";

export { Main };

class Main {
  static readonly SNIPER_XMPP_ID = "Sniper 1245";
  static readonly AUCTION_RESOURCE = "Auction";
  static readonly JOIN_COMMAND_FORMAT = "SOL Version: 1.1; Command: JOIN;";
  static readonly BID_COMMAND_FORMAT = (bid: number) =>
    `SOL Version: 1.1; Command: BID; Price: ${bid};`;

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
    connection.login(username, password, Main.AUCTION_RESOURCE);

    return connection;
  }
}

class SniperStateDisplayer implements SniperListener {
  constructor(itemId: string) {
    this.show("Auction Sniper");
    this.sniperStateChanged(SniperSnapshot.joining(itemId));
  }

  sniperStateChanged(snapshot: SniperSnapshot) {
    this.show(
      `${snapshot.itemId} - ${snapshot.lastPrice} - ${snapshot.lastBid} - ${snapshot.state}`
    );
  }

  private show(message: string): void {
    process.stdout.write(message);
  }
}

class XMPPAuction implements Auction {
  private chat: Chat;

  constructor(private connection: XMPPConnection, itemId: string) {
    this.chat = connection
      .getChatManager()
      .createChat(
        `auction-${itemId}@${connection.serviceName}/${Main.AUCTION_RESOURCE}`
      );
  }

  addAuctionEventListener(listener: AuctionEventListener) {
    this.chat.addMessageListener(
      new AuctionMessageTranslator(this.connection.user, listener)
    );
  }

  bid(amount: number) {
    this.chat.sendMessage(Main.BID_COMMAND_FORMAT(amount));
  }

  join() {
    this.chat.sendMessage(Main.JOIN_COMMAND_FORMAT);
  }
}
