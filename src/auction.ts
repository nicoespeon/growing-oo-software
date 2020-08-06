export { Auction };

interface Auction {
  bid: (amount: number) => void;
  join: () => void;
}
