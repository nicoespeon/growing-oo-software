export { Auction };

interface Auction {
  bid: (newPrice: number) => void;
}
