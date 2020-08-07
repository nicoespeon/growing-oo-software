import { Connection as XMPPConnection, Chat } from "./lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { SniperSnapshot } from "./sniper-snapshot";
import { SniperState } from "./sniper-state";

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
    const chat = connection
      .getChatManager()
      .createChat(Main.auctionId(itemId, connection));

    const auction = new XMPPAuction(chat);
    chat.addMessageListener(
      new AuctionMessageTranslator(
        connection.user,
        new AuctionSniper(auction, new SniperStateDisplayer(), itemId)
      )
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

  private static auctionId(itemId: string, connection: XMPPConnection): string {
    return `auction-${itemId}@${connection.serviceName}/${Main.AUCTION_RESOURCE}`;
  }
}

class SniperStateDisplayer implements SniperListener {
  constructor() {
    this.show("Auction Sniper");
    this.show(SniperState.JOINING);
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
  constructor(private chat: Chat) {}

  bid(amount: number) {
    this.chat.sendMessage(Main.BID_COMMAND_FORMAT(amount));
  }

  join() {
    this.chat.sendMessage(Main.JOIN_COMMAND_FORMAT);
  }
}
