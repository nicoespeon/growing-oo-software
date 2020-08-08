import { SniperListener } from "./auction-sniper";
import { SniperSnapshot } from "./sniper-snapshot";

export class SniperStateDisplayer implements SniperListener {
  constructor(itemId: string) {
    this.show("Auction Sniper");
    this.sniperStateChanged(SniperSnapshot.joining(itemId));
  }

  sniperStateChanged(snapshot: SniperSnapshot) {
    this.show(
      `${snapshot.itemId} - ${snapshot.lastPrice} - ${snapshot.lastBid} - ${snapshot.state}`
    );
  }

  private show(message: string): void {
    process.stdout.write(message);
  }
}
