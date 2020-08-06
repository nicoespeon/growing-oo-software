import { Connection as XMPPConnection, Message, Chat } from "./lib/xmpp";
import { AuctionMessageTranslator } from "./auction-message-translator";
import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";

export { Main, MainWindow };

class Main implements SniperListener {
  static readonly AUCTION_RESOURCE = "Auction";
  static readonly JOIN_COMMAND_FORMAT = "SOL Version: 1.1; Command: JOIN;";
  static readonly BID_COMMAND_FORMAT = (bid: number) =>
    `SOL Version: 1.1; Command: BID; Price: ${bid};`;
  private ui: MainWindow;

  constructor() {
    this.ui = new MainWindow();
  }

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

  sniperLost() {
    this.ui.showStatus(MainWindow.STATUS_LOST);
  }

  sniperBidding() {
    // TODO: implement
  }

  private joinAuction(connection: XMPPConnection, itemId: string) {
    const chat = connection
      .getChatManager()
      .createChat(Main.auctionId(itemId, connection));
    chat.addMessageListener(
      new AuctionMessageTranslator(
        new AuctionSniper(new ChatAuction(chat), this)
      )
    );
    chat.sendMessage(new Message(Main.JOIN_COMMAND_FORMAT));
  }

  private static connection(
    hostName: string,
    username: string,
    password: string
  ): XMPPConnection {
    const connection = new XMPPConnection(hostName);
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
  static readonly STATUS_LOST = "lost";

  constructor() {
    process.stdout.write("Auction Sniper");
    this.showStatus(MainWindow.STATUS_JOINING);
  }

  showStatus(status: string) {
    process.stdout.write(status);
  }
}

class ChatAuction implements Auction {
  constructor(private chat: Chat) {}

  bid(amount: number) {
    this.chat.sendMessage(new Message(Main.BID_COMMAND_FORMAT(amount)));
  }
}
