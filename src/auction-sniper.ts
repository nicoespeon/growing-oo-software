import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { Auction } from "./auction";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
  sniperWon: () => void;
  sniperBidding: () => void;
  sniperWinning: () => void;
}

class AuctionSniper implements AuctionEventListener {
  private isWinning = false;

  constructor(private auction: Auction, private listener: SniperListener) {}

  auctionClosed() {
    if (this.isWinning) {
      this.listener.sniperWon();
    } else {
      this.listener.sniperLost();
    }
  }

  currentPrice(price: number, increment: number, source: PriceSource) {
    this.isWinning = source === PriceSource.FromSniper;

    if (this.isWinning) {
      this.listener.sniperWinning();
    } else {
      this.auction.bid(price + increment);
      this.listener.sniperBidding();
    }
  }
}
