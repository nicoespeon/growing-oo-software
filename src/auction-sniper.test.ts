import { SniperListener, AuctionSniper } from "./auction-sniper";
import { Auction } from "./auction";

describe("AuctionSniper", () => {
  it("should report lost when auction closes", () => {
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener);

    sniper.auctionClosed();

    expect(sniperListener.sniperLost).toBeCalled();
  });

  it("should bid higher and report bidding when new price arrives", () => {
    const price = 1001;
    const increment = 25;
    const auction = new FakeAuction();
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(auction, sniperListener);

    sniper.currentPrice(price, increment);

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
}
