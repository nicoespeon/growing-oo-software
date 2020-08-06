import { Connection as XMPPConnection, Chat } from "./lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { SniperState } from "./sniper-state";

export { Main, MainWindow };

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
        new AuctionSniper(auction, new SniperStateDisplayer())
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

class MainWindow {
  static readonly STATUS_JOINING = "joining";
  static readonly STATUS_BIDDING = "bidding";
  static readonly STATUS_WINNING = "winning";
  static readonly STATUS_LOST = "lost";
  static readonly STATUS_WON = "won";

  constructor() {
    process.stdout.write("Auction Sniper");
    this.showStatus(MainWindow.STATUS_JOINING);
  }

  showStatus(status: string) {
    process.stdout.write(status);
  }

  sniperStatusChanged(state: SniperState, status: string) {
    process.stdout.write(
      `${state.itemId} - ${state.lastPrice} - ${state.lastBid} - ${status}`
    );
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

class SniperStateDisplayer implements SniperListener {
  private ui: MainWindow;

  constructor() {
    this.ui = new MainWindow();
  }

  sniperLost() {
    this.ui.showStatus(MainWindow.STATUS_LOST);
  }

  sniperWon() {
    this.ui.showStatus(MainWindow.STATUS_WON);
  }

  sniperBidding(state: SniperState) {
    this.ui.sniperStatusChanged(state, MainWindow.STATUS_BIDDING);
  }

  sniperWinning() {
    this.ui.showStatus(MainWindow.STATUS_WINNING);
  }
}
