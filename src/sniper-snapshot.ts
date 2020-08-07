import { SniperState } from "./sniper-state";

export { SniperSnapshot };

class SniperSnapshot {
  constructor(
    public readonly itemId: string,
    public readonly lastPrice: number,
    public readonly lastBid: number,
    public readonly state: SniperState
  ) {}

  static joining(itemId: string): SniperSnapshot {
    return new SniperSnapshot(itemId, 0, 0, SniperState.JOINING);
  }

  bidding(newLastPrice: number, newLastBid: number): SniperSnapshot {
    return new SniperSnapshot(
      this.itemId,
      newLastPrice,
      newLastBid,
      SniperState.BIDDING
    );
  }

  winning(newLastPrice: number): SniperSnapshot {
    return new SniperSnapshot(
      this.itemId,
      newLastPrice,
      this.lastBid,
      SniperState.WINNING
    );
  }
}
