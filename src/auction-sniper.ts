import { AuctionEventListener } from "./auction-event-listener";

export { SniperListener, AuctionSniper };

interface SniperListener {
  sniperLost: () => void;
}

class AuctionSniper implements AuctionEventListener {
  constructor(private listener: SniperListener) {}

  auctionClosed() {
    this.listener.sniperLost();
  }

  currentPrice() {}
}
