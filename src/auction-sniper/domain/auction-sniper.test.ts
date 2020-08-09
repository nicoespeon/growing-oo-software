import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { PriceSource } from "./auction-event-listener";
import { SniperSnapshot } from "./sniper-snapshot";
import { SniperState } from "./sniper-state";
import { Item } from "./item";

describe("AuctionSniper", () => {
  const ITEM = new Item("item ID", 1234);
  let state: string;

  beforeEach(() => {
    state = "fresh";
  });

  it("should report lost when auction closes immediately", () => {
    const { sniperListener, sniper } = setup();

    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 0, 0, SniperState.LOST)
    );
  });

  it("should bid higher and report bidding when new price arrives from other bidder", () => {
    const { auction, sniperListener, sniper } = setup();
    const price = 1001;
    const increment = 25;
    const bid = price + increment;

    sniper.currentPrice(price, increment, PriceSource.FromOtherBidder);

    expect(auction.bid).toBeCalledTimes(1);
    expect(auction.bid).toBeCalledWith(bid);
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, price, bid, SniperState.BIDDING)
    );
  });

  it("should report winning when new price arrives from sniper", () => {
    const { sniperListener, sniper } = setup();
    allowingSniperBidding(sniperListener);

    sniper.currentPrice(1001, 25, PriceSource.FromOtherBidder);
    sniper.currentPrice(1026, 25, PriceSource.FromSniper);

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 1026, 1026, SniperState.WINNING)
    );
    expect(state).toBe("bidding");
  });

  it("should report lost if auction closes when bidding", () => {
    const { sniperListener, sniper } = setup();
    allowingSniperBidding(sniperListener);

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 123, 168, SniperState.LOST)
    );
    expect(state).toBe("bidding");
  });

  it("should report won if auction closes when winning", () => {
    const { sniperListener, sniper } = setup();
    allowingSniperWinning(sniperListener);

    sniper.currentPrice(123, 45, PriceSource.FromSniper);
    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 123, 0, SniperState.WON)
    );
    expect(state).toBe("winning");
  });

  it("should not bid and report losing if subsequent price is above stop price", () => {
    const { auction, sniperListener, sniper } = setup();
    allowingSniperBidding(sniperListener);

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.currentPrice(2345, 25, PriceSource.FromOtherBidder);

    const bid = 123 + 45;
    expect(auction.bid).toBeCalledWith(bid);
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 2345, bid, SniperState.LOSING)
    );
    expect(state).toBe("bidding");
  });

  it("should not bid and report losing if first price is above stop price", () => {
    const { auction, sniperListener, sniper } = setup();

    sniper.currentPrice(2345, 25, PriceSource.FromOtherBidder);

    expect(auction.bid).not.toBeCalled();
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 2345, 0, SniperState.LOSING)
    );
  });

  it("should report lost if auction closes when losing", () => {
    const { auction, sniperListener, sniper } = setup();

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.currentPrice(2345, 25, PriceSource.FromOtherBidder);
    sniper.auctionClosed();

    const bid = 123 + 45;
    expect(auction.bid).toBeCalledWith(bid);
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 2345, bid, SniperState.LOST)
    );
  });

  it("should continue to be losing once stop price has been reached", () => {
    const { auction, sniperListener, sniper } = setup();

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.currentPrice(2345, 25, PriceSource.FromOtherBidder);
    sniper.currentPrice(3456, 25, PriceSource.FromOtherBidder);
    sniper.currentPrice(4567, 25, PriceSource.FromOtherBidder);

    const bid = 123 + 45;
    expect(auction.bid).toBeCalledWith(bid);
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 4567, bid, SniperState.LOSING)
    );
  });

  it("should not bid and report losing if price after winning is above stop price", () => {
    const { auction, sniperListener, sniper } = setup();
    allowingSniperWinning(sniperListener);

    sniper.currentPrice(123, 45, PriceSource.FromSniper);
    sniper.currentPrice(2345, 25, PriceSource.FromOtherBidder);

    expect(auction.bid).not.toBeCalled();
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM.identifier, 2345, 0, SniperState.LOSING)
    );
    expect(state).toBe("winning");
  });

  function setup() {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM);

    return { auction, sniperListener, sniper };
  }

  function allowingSniperBidding(sniperListener: FakeSniperListener) {
    sniperListener.sniperStateChanged.mockImplementationOnce(
      (snapshot: SniperSnapshot) => {
        expect(snapshot.state).toBe(SniperState.BIDDING);
        state = "bidding";
      }
    );
  }

  function allowingSniperWinning(sniperListener: FakeSniperListener) {
    sniperListener.sniperStateChanged.mockImplementationOnce(
      (snapshot: SniperSnapshot) => {
        expect(snapshot.state).toBe(SniperState.WINNING);
        state = "winning";
      }
    );
  }
});

class FakeSniperListener implements SniperListener {
  sniperStateChanged = jest.fn();
}

class FakeAuction implements Auction {
  addAuctionEventListener = jest.fn();
  bid = jest.fn();
  join = jest.fn();
}
