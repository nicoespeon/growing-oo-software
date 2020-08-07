export { SniperSnapshot };

class SniperSnapshot {
  constructor(
    public readonly itemId: string,
    public readonly lastPrice: number,
    public readonly lastBid: number
  ) {}
}
