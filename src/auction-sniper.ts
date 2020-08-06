import { AuctionEventListener } from "./auction-event-listener";
import { Auction } from "./auction";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
  sniperBidding: () => void;
}

class AuctionSniper implements AuctionEventListener {
  constructor(private auction: Auction, private listener: SniperListener) {}

  auctionClosed() {
    this.listener.sniperLost();
  }

  currentPrice(price: number, increment: number) {}
}
