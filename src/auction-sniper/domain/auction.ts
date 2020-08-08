import { AuctionEventListener } from "./auction-event-listener";

export { Auction, AuctionHouse };

interface Auction {
  addAuctionEventListener: (listener: AuctionEventListener) => void;
  bid: (amount: number) => void;
  join: () => void;
}

interface AuctionHouse {
  auctionFor: (itemId: string) => Auction;
}
