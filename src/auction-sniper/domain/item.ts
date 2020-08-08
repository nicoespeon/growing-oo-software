export { Item };

class Item {
  constructor(readonly identifier: string, readonly stopPrice?: number) {}

  allowsBid(bid: number): boolean {
    if (!this.stopPrice) return true;
    return bid <= this.stopPrice;
  }
}
