import { AuctionEventListener, PriceSource } from "./auction-event-listener";
import { Auction } from "./auction";
import { SniperSnapshot } from "./sniper-snapshot";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperStateChanged: (snapshot: SniperSnapshot) => void;
}

class AuctionSniper implements AuctionEventListener {
  private snapshot: SniperSnapshot;

  constructor(
    private auction: Auction,
    private listener: SniperListener,
    itemId: string
  ) {
    this.snapshot = SniperSnapshot.joining(itemId);
  }

  auctionClosed() {
    this.snapshot = this.snapshot.closed();
    this.notifyChange();
  }

  currentPrice(price: number, increment: number, source: PriceSource) {
    switch (source) {
      case PriceSource.FromSniper:
        this.snapshot = this.snapshot.winning(price);
        break;

      case PriceSource.FromOtherBidder:
        const bid = price + increment;
        this.auction.bid(bid);
        this.snapshot = this.snapshot.bidding(price, bid);
        break;
    }

    this.notifyChange();
  }

  private notifyChange(): void {
    this.listener.sniperStateChanged(this.snapshot);
  }
}
