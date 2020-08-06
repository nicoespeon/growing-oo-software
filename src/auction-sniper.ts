import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { Auction } from "./auction";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
  sniperBidding: () => void;
  sniperWinning: () => void;
}

class AuctionSniper implements AuctionEventListener {
  constructor(private auction: Auction, private listener: SniperListener) {}

  auctionClosed() {
    this.listener.sniperLost();
  }

  currentPrice(price: number, increment: number, source: PriceSource) {
    switch (source) {
      case PriceSource.FromSniper:
        this.listener.sniperWinning();
        break;

      case PriceSource.FromOtherBidder:
        this.auction.bid(price + increment);
        this.listener.sniperBidding();
        break;
    }
  }
}
