export { AuctionEventListener };

interface AuctionEventListener {
  auctionClosed: () => void;
  currentPrice: (price: number, increment: number) => void;
}
