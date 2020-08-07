import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { PriceSource } from "./auction-event-listener";
import { SniperSnapshot } from "./sniper-snapshot";
import { SniperState } from "./sniper-state";

describe("AuctionSniper", () => {
  const ITEM_ID = "item ID";

  it("should report lost when auction closes immediately", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM_ID, 0, 0, SniperState.LOST)
    );
  });

  it("should bid higher and report bidding when new price arrives from other bidder", () => {
    const price = 1001;
    const increment = 25;
    const bid = price + increment;
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(price, increment, PriceSource.FromOtherBidder);

    expect(auction.bid).toBeCalledTimes(1);
    expect(auction.bid).toBeCalledWith(bid);
    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM_ID, price, bid, SniperState.BIDDING)
    );
  });

  it("should report winning when new price arrives from sniper", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);
    let state = "fresh";
    sniperListener.sniperStateChanged.mockImplementationOnce(
      (snapshot: SniperSnapshot) => {
        expect(snapshot.state).toBe(SniperState.BIDDING);
        state = "bidding";
      }
    );

    sniper.currentPrice(1001, 25, PriceSource.FromOtherBidder);
    sniper.currentPrice(1026, 25, PriceSource.FromSniper);

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM_ID, 1026, 1026, SniperState.WINNING)
    );
    expect(state).toBe("bidding");
  });

  it("should report lost if auction closes when bidding", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    let state = "fresh";
    sniperListener.sniperStateChanged.mockImplementationOnce(
      (snapshot: SniperSnapshot) => {
        expect(snapshot.state).toBe(SniperState.BIDDING);
        state = "bidding";
      }
    );
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM_ID, 123, 168, SniperState.LOST)
    );
    expect(state).toBe("bidding");
  });

  it("should report won if auction closes when winning", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    let state = "fresh";
    sniperListener.sniperStateChanged.mockImplementation(
      () => (state = "winning")
    );
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(123, 45, PriceSource.FromSniper);
    sniper.auctionClosed();

    expect(sniperListener.sniperStateChanged).toBeCalledWith(
      new SniperSnapshot(ITEM_ID, 123, 0, SniperState.WON)
    );
    expect(state).toBe("winning");
  });
});

class FakeSniperListener implements SniperListener {
  sniperStateChanged = jest.fn();
}

class FakeAuction implements Auction {
  bid = jest.fn();
  join = jest.fn();
}
