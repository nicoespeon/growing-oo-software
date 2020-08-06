import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";
import { PriceSource } from "./auction-event-listener";

describe("AuctionSniper", () => {
  it("should report lost when auction closes", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener);

    sniper.auctionClosed();

    expect(sniperListener.sniperLost).toBeCalled();
  });

  it("should bid higher and report bidding when new price arrives from other bidder", () => {
    const price = 1001;
    const increment = 25;
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener);

    sniper.currentPrice(price, increment, PriceSource.FromOtherBidder);

    expect(auction.bid).toBeCalledTimes(1);
    expect(auction.bid).toBeCalledWith(price + increment);
    expect(sniperListener.sniperBidding).toBeCalled();
  });
});

class FakeSniperListener implements SniperListener {
  sniperLost = jest.fn();
  sniperBidding = jest.fn();
}

class FakeAuction implements Auction {
  bid = jest.fn();
  join = jest.fn();
}
