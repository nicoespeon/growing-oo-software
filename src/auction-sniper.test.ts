import { SniperListener, AuctionSniper } from "./auction-sniper";

describe("AuctionSniper", () => {
  it("should report lost when auction closes", () => {
    const sniperListener = new FakeSniperListener();
    const sniper = new AuctionSniper(sniperListener);

    sniper.auctionClosed();

    expect(sniperListener.sniperLost).toBeCalled();
  });
});

class FakeSniperListener implements SniperListener {
  sniperLost = jest.fn();
}
