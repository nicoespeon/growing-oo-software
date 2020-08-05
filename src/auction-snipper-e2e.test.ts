import { Time, wait } from "./lib/chronos";
import { BlockingQueue } from "./lib/queue";
import { Thread } from "./lib/thread";
import {
  Connection as XMPPConnection,
  Chat,
  Message,
  MessageListener,
} from "./lib/xmpp";
import { AuctionServer } from "./auction-server";
import { Main, MainWindow } from "./index";

describe("Auction Snipper", () => {
  let auction: FakeAuctionServer;
  let application: ApplicationRunner;

  beforeEach(() => {
    // Even for E2E test we use a fake server because the actual one
    // from 3rd party is not easy to access => pragmatic choice!
    auction = new FakeAuctionServer("item-54387");

    // We put test logic in an ApplicationRunner to be more expressive in tests
    application = new ApplicationRunner();

    jest.setTimeout(10000);
  });

  afterEach(() => {
    auction.stop();
    application.stop();
  });

  it("should join auction until auction closes", async () => {
    auction.startSellingItem();
    await application.startBiddingIn(auction);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPPER_XMPP_ID
    );

    auction.announceClosed();
    await application.showsSniperHasLostAuction();
  });

  it("should make a higher bid but loose", async () => {
    auction.startSellingItem();
    await application.startBiddingIn(auction);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPPER_XMPP_ID
    );

    auction.reportPrice(1000, 98, "other bidder");
    await application.hasShownSniperIsBidding();
    await auction.hasReceivedBid(1098, ApplicationRunner.SNIPPER_XMPP_ID);

    auction.announceClosed();
    await application.showsSniperHasLostAuction();
  });
});

class FakeAuctionServer implements AuctionServer {
  static readonly ITEM_ID_AS_LOGIN = "auction-%s";
  static readonly AUCTION_RESOURCE = "Auction";
  static readonly AUCTION_PASSWORD = "auction";

  private connection: XMPPConnection;
  private currentChat: Chat | undefined;
  private messageListener = new SingleMessageListener();

  get XMPP_HOST_NAME(): string {
    return "localhost";
  }

  constructor(public readonly itemId: string) {
    this.connection = new XMPPConnection(
      this.XMPP_HOST_NAME,
      ApplicationRunner.SNIPPER_XMPP_ID
    );
  }

  startSellingItem() {
    this.connection.connect();
    this.connection.login(
      FakeAuctionServer.ITEM_ID_AS_LOGIN.replace("%s", this.itemId),
      FakeAuctionServer.AUCTION_PASSWORD,
      FakeAuctionServer.AUCTION_RESOURCE
    );
    this.connection.getChatManager().addChatListener({
      chatCreated: (chat: Chat) => {
        this.currentChat = chat;
        chat.addMessageListener(this.messageListener);
      },
    });
  }

  reportPrice(price: number, increment: number, bidder: string) {
    this.currentChat?.sendMessage(
      new Message(
        `SOLVersion: 1.1; Event: PRICE; CurrentPrice: ${price}; Increment: ${increment}; Bidder: ${bidder};`
      )
    );
  }

  announceClosed() {
    this.currentChat?.sendMessage(new Message());
  }

  stop() {
    this.connection.disconnect();
    this.messageListener.clear();
  }

  async hasReceivedJoinRequestFromSniper(sniperId: string) {
    await this.receivesAMessageMatching(
      sniperId,
      expect.stringMatching(Main.JOIN_COMMAND_FORMAT)
    );
  }

  async hasReceivedBid(bid: number, sniperId: string) {
    await this.receivesAMessageMatching(
      sniperId,
      expect.stringMatching(Main.BID_COMMAND_FORMAT(bid))
    );
  }

  private async receivesAMessageMatching(
    sniperId: string,
    messageMatcher: jest.CustomMatcher
  ) {
    await this.messageListener.receivesAMessage(messageMatcher);
    expect(this.currentChat?.participant).toBe(sniperId);
  }
}

class SingleMessageListener implements MessageListener {
  private messages = new BlockingQueue<Message>(1);

  processMessage(_chat: Chat, message: Message) {
    this.messages.add(message);
  }

  async receivesAMessage(messageMatcher: jest.CustomMatcher) {
    const message = await this.messages.poll(new Time(5, "second"));
    expect(message).not.toBeNull();
    expect(message!.body).toEqual(messageMatcher);
  }

  clear() {
    this.messages.clear();
  }
}

/**
 * Test logic wrapper.
 *
 * Provides an expressive API to use in tests.
 * Instantiate the application and exercise it. Runs expectations.
 */
class ApplicationRunner {
  static readonly SNIPPER_XMPP_ID = "Sniper XMPP ID";
  static readonly SNIPER_ID = "sniper";
  static readonly SNIPER_PASSWORD = "sniper";

  private driver: AuctionSniperDriver;

  constructor() {
    this.driver = new AuctionSniperDriver(1000);
  }

  async startBiddingIn(auction: AuctionServer): Promise<void> {
    const thread = new Thread("Test Application", () => {
      Main.main(
        auction.XMPP_HOST_NAME,
        ApplicationRunner.SNIPER_ID,
        ApplicationRunner.SNIPER_PASSWORD,
        auction.itemId
      );
    });
    thread.start();

    await this.driver.showsSniperStatus(MainWindow.STATUS_JOINING);
  }

  async showsSniperHasLostAuction(): Promise<void> {
    await this.driver.showsSniperStatus(MainWindow.STATUS_LOST);
  }

  async hasShownSniperIsBidding(): Promise<void> {
    await this.driver.showsSniperStatus(MainWindow.STATUS_BIDDING);
  }

  stop(): void {
    this.driver.dispose();
  }
}

class AuctionSniperDriver {
  private driver: CLIDriver;

  constructor(timeoutInMs: number) {
    this.driver = new CLIDriver(timeoutInMs);
  }

  async showsSniperStatus(status: string): Promise<void> {
    await this.driver.hasText(status);
  }

  dispose(): void {
    this.driver.dispose();
  }
}

class CLIDriver {
  private timeout: Time;
  private stdout: jest.SpyInstance;

  constructor(timeoutInMs: number) {
    this.timeout = new Time(timeoutInMs, "millisecond");
    this.stdout = jest.spyOn(process.stdout, "write");
  }

  async hasText(text: string): Promise<void> {
    // TODO: improve to resolve asap
    await wait(this.timeout);
    // TODO: improve to test containing string
    expect(this.stdout).toBeCalledWith(text);
  }

  dispose(): void {
    this.stdout.mockRestore();
  }
}
