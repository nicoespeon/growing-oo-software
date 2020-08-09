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

  losing(newLastPrice: number): SniperSnapshot {
    return new SniperSnapshot(
      this.itemId,
      newLastPrice,
      this.lastBid,
      SniperState.LOSING
    );
  }

  closed(): SniperSnapshot {
    return new SniperSnapshot(
      this.itemId,
      this.lastPrice,
      this.lastBid,
      this.stateWhenAuctionClosed
    );
  }

  failed(): SniperSnapshot {
    return new SniperSnapshot(this.itemId, 0, 0, SniperState.FAILED);
  }

  get stateWhenAuctionClosed(): SniperState {
    switch (this.state) {
      case SniperState.JOINING:
        return SniperState.LOST;

      case SniperState.BIDDING:
        return SniperState.LOST;

      case SniperState.LOSING:
        return SniperState.LOST;

      case SniperState.WINNING:
        return SniperState.WON;

      case SniperState.FAILED:
        return SniperState.FAILED;

      case SniperState.WON:
      case SniperState.LOST:
        throw new Defect("Auction is already closed");
    }
  }
}

// Defect is an error that's due to a programming mistake
class Defect extends Error {}
