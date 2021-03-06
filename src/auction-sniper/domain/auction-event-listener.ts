export { AuctionEventListener, PriceSource };

interface AuctionEventListener {
  auctionClosed: () => void;
  auctionFailed: () => void;
  currentPrice: (price: number, increment: number, source: PriceSource) => void;
}

enum PriceSource {
  FromSniper = "from sniper",
  FromOtherBidder = "from other bidder",
}
