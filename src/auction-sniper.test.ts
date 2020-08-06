import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { PriceSource } from "./auction-event-listener";
import { SniperState } from "./sniper-state";

describe("AuctionSniper", () => {
  const ITEM_ID = "item ID";

  it("should report lost when auction closes immediately", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.auctionClosed();

    expect(sniperListener.sniperLost).toBeCalled();
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
    expect(sniperListener.sniperBidding).toBeCalledWith(
      new SniperState(ITEM_ID, price, bid)
    );
  });

  it("should report winning when new price arrives from sniper", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(1001, 25, PriceSource.FromSniper);

    expect(sniperListener.sniperWinning).toBeCalled();
  });

  it("should report lost if auction closes when bidding", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    let state = "fresh";
    sniperListener.sniperBidding.mockImplementation(() => (state = "bidding"));
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(123, 45, PriceSource.FromOtherBidder);
    sniper.auctionClosed();

    expect(sniperListener.sniperLost).toBeCalled();
    expect(state).toBe("bidding");
  });

  it("should report won if auction closes when winning", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    let state = "fresh";
    sniperListener.sniperWinning.mockImplementation(() => (state = "winning"));
    const sniper = new AuctionSniper(auction, sniperListener, ITEM_ID);

    sniper.currentPrice(123, 45, PriceSource.FromSniper);
    sniper.auctionClosed();

    expect(sniperListener.sniperWon).toBeCalled();
    expect(state).toBe("winning");
  });
});

class FakeSniperListener implements SniperListener {
  sniperLost = jest.fn();
  sniperWon = jest.fn();
  sniperBidding = jest.fn();
  sniperWinning = jest.fn();
}

class FakeAuction implements Auction {
  bid = jest.fn();
  join = jest.fn();
}
