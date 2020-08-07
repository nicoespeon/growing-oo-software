import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { Auction } from "./auction";
import { SniperSnapshot } from "./sniper-snapshot";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
  sniperWon: () => void;
  sniperStateChanged: (snapshot: SniperSnapshot) => void;
}

class AuctionSniper implements AuctionEventListener {
  private isWinning = false;
  private snapshot: SniperSnapshot;

  constructor(
    private auction: Auction,
    private listener: SniperListener,
    itemId: string
  ) {
    this.snapshot = SniperSnapshot.joining(itemId);
  }

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
      this.snapshot = this.snapshot.winning(price);
    } else {
      const bid = price + increment;
      this.auction.bid(bid);
      this.snapshot = this.snapshot.bidding(price, bid);
    }

    this.listener.sniperStateChanged(this.snapshot);
  }
}
