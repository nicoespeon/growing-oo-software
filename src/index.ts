import {
  Connection as XMPPConnection,
  Message,
  MessageListener,
  Chat,
} from "./lib/xmpp";

export { Main, MainWindow };

class Main {
  static readonly AUCTION_RESOURCE = "Auction";
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

  private joinAuction(connection: XMPPConnection, itemId: string) {
    const chat = connection
      .getChatManager()
      .createChat(
        Main.auctionId(itemId, connection),
        new UIMessageListener(this.ui)
      );
    chat.sendMessage(new Message());
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
  static readonly STATUS_LOST = "lost";

  constructor() {
    process.stdout.write("Auction Sniper");
    this.showStatus(MainWindow.STATUS_JOINING);
  }

  showStatus(status: string) {
    process.stdout.write(status);
  }
}

class UIMessageListener implements MessageListener {
  constructor(private ui: MainWindow) {}

  processMessage(_chat: Chat, _message: Message) {
    this.ui.showStatus(MainWindow.STATUS_LOST);
  }
}
