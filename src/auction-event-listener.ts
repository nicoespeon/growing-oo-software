export { AuctionEventListener };

interface AuctionEventListener {
  auctionClosed: () => void;
}
