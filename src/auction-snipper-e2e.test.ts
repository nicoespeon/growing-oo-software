import { Time, wait } from "./lib/chronos";
import { BlockingQueue } from "./lib/queue";
import { Thread } from "./lib/thread";
import {
  Connection as XMPPConnection,
  Chat,
  Message,
  MessageListener,
} from "./lib/xmpp";

import { Main } from "./auction-sniper";
import { AuctionServer } from "./auction-sniper/domain/auction-server";
import { SniperState } from "./auction-sniper/domain/sniper-state";
import { XMPPAuction } from "./auction-sniper/adapters/xmpp-auction";

describe("Auction Snipper", () => {
  let auction: FakeAuctionServer;
  let auction2: FakeAuctionServer;
  let application: ApplicationRunner;

  beforeEach(() => {
    // Even for E2E test we use a fake server because the actual one
    // from 3rd party is not easy to access => pragmatic choice!
    auction = new FakeAuctionServer("item-54387");
    auction2 = new FakeAuctionServer("item-65432");

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
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.announceClosed();
    await application.showsSniperHasLostAuction(auction, 0, 0);
  });

  it("should make a higher bid but loose", async () => {
    auction.startSellingItem();
    await application.startBiddingIn(auction);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.reportPrice(1000, 98, "other bidder");
    await application.hasShownSniperIsBidding(auction, 1000, 98);
    await auction.hasReceivedBid(1098, ApplicationRunner.SNIPER_XMPP_ID);

    auction.announceClosed();
    await application.showsSniperHasLostAuction(auction, 1098, 0);
  });

  it("should win an auction by bidding higher", async () => {
    auction.startSellingItem();
    await application.startBiddingIn(auction);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.reportPrice(1000, 98, "other bidder");
    await application.hasShownSniperIsBidding(auction, 1000, 98);
    await auction.hasReceivedBid(1098, ApplicationRunner.SNIPER_XMPP_ID);

    auction.reportPrice(1098, 97, ApplicationRunner.SNIPER_XMPP_ID);
    await application.hasShownSniperIsWinning(auction, 1098);

    auction.announceClosed();
    await application.showsSniperHasWonAuction(auction, 1098);
  });

  it("should bid for multiple items", async () => {
    auction.startSellingItem();
    auction2.startSellingItem();
    await application.startBiddingIn(auction, auction2);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );
    await auction2.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.reportPrice(1000, 98, "other bidder");
    await auction.hasReceivedBid(1098, ApplicationRunner.SNIPER_XMPP_ID);

    auction2.reportPrice(500, 21, "other bidder");
    await auction2.hasReceivedBid(521, ApplicationRunner.SNIPER_XMPP_ID);

    auction.reportPrice(1098, 97, ApplicationRunner.SNIPER_XMPP_ID);
    auction2.reportPrice(521, 22, ApplicationRunner.SNIPER_XMPP_ID);
    await application.hasShownSniperIsWinning(auction, 1098);
    await application.hasShownSniperIsWinning(auction2, 521);

    auction.announceClosed();
    auction2.announceClosed();
    await application.showsSniperHasWonAuction(auction, 1098);
    await application.showsSniperHasWonAuction(auction2, 521);
  });

  it("should lose an auction when the price is too high", async () => {
    auction.startSellingItem();
    await application.startBiddingWithStopPrice(auction, 1100);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.reportPrice(1000, 98, "other bidder");
    await application.hasShownSniperIsBidding(auction, 1000, 1098);
    await auction.hasReceivedBid(1098, ApplicationRunner.SNIPER_XMPP_ID);

    auction.reportPrice(1197, 10, "third party");
    await application.hasShownSniperIsLosing(auction, 1197, 1098);

    auction.reportPrice(1207, 10, "fourth party");
    await application.hasShownSniperIsLosing(auction, 1207, 1098);

    auction.announceClosed();
    await application.showsSniperHasLostAuction(auction, 1207, 1098);
  });

  it("should report invalid auction message and stop responding to events", async () => {
    auction.startSellingItem();
    auction2.startSellingItem();
    await application.startBiddingIn(auction, auction2);
    await auction.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );

    auction.reportPrice(500, 20, "other bidder");
    await auction.hasReceivedBid(520, ApplicationRunner.SNIPER_XMPP_ID);

    const brokenMessage = "a broken message";
    auction.sendInvalidMessageContaining(brokenMessage);
    await application.showsSniperHasFailed(auction);

    auction.reportPrice(520, 21, "other bidder");
    await waitForAnotherAuctionEvent();
    await application.reportsInvalidMessage(auction, brokenMessage);
    await auction.hasNotReceivedBid(541, ApplicationRunner.SNIPER_XMPP_ID);
    await application.showsSniperHasFailed(auction);
  });

  async function waitForAnotherAuctionEvent() {
    await auction2.hasReceivedJoinRequestFromSniper(
      ApplicationRunner.SNIPER_XMPP_ID
    );
    auction2.reportPrice(600, 6, "other bidder");
    await application.hasShownSniperIsBidding(auction2, 600, 606);
  }
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
      ApplicationRunner.SNIPER_XMPP_ID
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
      `SOLVersion: 1.1; Event: PRICE; CurrentPrice: ${price}; Increment: ${increment}; Bidder: ${bidder};`
    );
  }

  sendInvalidMessageContaining(message: string) {
    this.currentChat?.sendMessage(`SOL Version: 1.1; ${message}`);
  }

  announceClosed() {
    this.currentChat?.sendMessage("SOL Version: 1.1; Event: CLOSE;");
  }

  stop() {
    this.connection.disconnect();
    this.messageListener.clear();
  }

  async hasReceivedJoinRequestFromSniper(sniperId: string) {
    await this.receivesAMessageMatching(
      sniperId,
      expect.stringMatching(XMPPAuction.joinCommandFormat())
    );
  }

  async hasReceivedBid(bid: number, sniperId: string) {
    await this.receivesAMessageMatching(
      sniperId,
      expect.stringMatching(XMPPAuction.bidCommandFormat(bid))
    );
  }

  async hasNotReceivedBid(bid: number, sniperId: string) {
    await this.messageListener.receivesAMessage(
      expect.not.stringMatching(XMPPAuction.bidCommandFormat(bid))
    );
    expect(this.currentChat?.participant).toBe(sniperId);
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
    // Our fake auction server also sends messages that aren't consumed.
    // If we don't clear the queue, it won't poll the application messages.
    if (this.messages.remainingCapacity === 0) {
      this.messages.clear();
    }

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
  static readonly SNIPER_XMPP_ID = "Sniper XMPP ID";
  static readonly SNIPER_ID = "sniper";
  static readonly SNIPER_PASSWORD = "sniper";

  private driver: AuctionSniperDriver;

  constructor() {
    this.driver = new AuctionSniperDriver(1000);
  }

  async startBiddingIn(...auctions: AuctionServer[]): Promise<void> {
    const thread = new Thread("Test Application", () => {
      auctions.forEach((auction) => {
        Main.main(
          auction.XMPP_HOST_NAME,
          ApplicationRunner.SNIPER_ID,
          ApplicationRunner.SNIPER_PASSWORD,
          auction.itemId
        );
      });
    });
    thread.start();

    for (let auction of auctions) {
      await this.driver.showsSniperStatus(
        auction.itemId,
        0,
        0,
        SniperState.JOINING
      );
    }
  }

  async startBiddingWithStopPrice(auction: AuctionServer, stopPrice: number) {
    const thread = new Thread("Test Application", () => {
      Main.main(
        auction.XMPP_HOST_NAME,
        ApplicationRunner.SNIPER_ID,
        ApplicationRunner.SNIPER_PASSWORD,
        auction.itemId,
        stopPrice
      );
    });
    thread.start();

    await this.driver.showsSniperStatus(
      auction.itemId,
      0,
      0,
      SniperState.JOINING
    );
  }

  async showsSniperHasLostAuction(
    auction: FakeAuctionServer,
    lastPrice: number,
    lastBid: number
  ): Promise<void> {
    await this.driver.showsSniperStatus(
      auction.itemId,
      lastPrice,
      lastBid,
      SniperState.LOST
    );
  }

  async showsSniperHasWonAuction(
    auction: FakeAuctionServer,
    lastPrice: number
  ): Promise<void> {
    await this.driver.showsSniperStatus(
      auction.itemId,
      lastPrice,
      lastPrice,
      SniperState.WON
    );
  }

  async showsSniperHasFailed(auction: FakeAuctionServer) {
    await this.driver.showsSniperStatus(
      auction.itemId,
      0,
      0,
      SniperState.FAILED
    );
  }

  async reportsInvalidMessage(auction: FakeAuctionServer, message: string) {
    // TODO: implement
  }

  async hasShownSniperIsBidding(
    auction: FakeAuctionServer,
    lastPrice: number,
    lastBid: number
  ): Promise<void> {
    await this.driver.showsSniperStatus(
      auction.itemId,
      lastPrice,
      lastBid,
      SniperState.BIDDING
    );
  }

  async hasShownSniperIsWinning(
    auction: FakeAuctionServer,
    winningBid: number
  ): Promise<void> {
    await this.driver.showsSniperStatus(
      auction.itemId,
      winningBid,
      winningBid,
      SniperState.WINNING
    );
  }

  async hasShownSniperIsLosing(
    auction: FakeAuctionServer,
    lastPrice: number,
    lastBid: number
  ): Promise<void> {
    await this.driver.showsSniperStatus(
      auction.itemId,
      lastPrice,
      lastBid,
      SniperState.LOSING
    );
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

  async showsSniperStatus(itemId: string): Promise<void>;
  async showsSniperStatus(
    itemId: string,
    lastPrice: number,
    lastBid: number,
    status: string
  ): Promise<void>;
  async showsSniperStatus(...args: (string | number)[]): Promise<void> {
    await this.driver.hasTexts(args.map(String));
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

  async hasTexts(texts: string[]): Promise<void> {
    // TODO: improve to resolve asap
    await wait(this.timeout);
    texts.forEach((text) =>
      expect(this.stdout).toBeCalledWith(expect.stringContaining(text))
    );
  }

  dispose(): void {
    this.stdout.mockRestore();
  }
}
