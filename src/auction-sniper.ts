import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { Auction } from "./auction";
import { SniperSnapshot } from "./sniper-snapshot";
import { SniperState } from "./sniper-state";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
  sniperWon: () => void;
  sniperStateChanged: (snapshot: SniperSnapshot) => void;
  sniperWinning: () => void;
}

class AuctionSniper implements AuctionEventListener {
  private isWinning = false;

  constructor(
    private auction: Auction,
    private listener: SniperListener,
    private readonly itemId: string
  ) {}

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
      const bid = price + increment;
      this.auction.bid(bid);
      this.listener.sniperStateChanged(
        new SniperSnapshot(this.itemId, price, bid, SniperState.BIDDING)
      );
    }
  }
}
