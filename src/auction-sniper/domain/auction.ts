import { AuctionEventListener } from "./auction-event-listener";
import { Item } from "./item";

export { Auction, AuctionHouse };

interface Auction {
  addAuctionEventListener: (listener: AuctionEventListener) => void;
  bid: (amount: number) => void;
  join: () => void;
}

interface AuctionHouse {
  auctionFor: (item: Item) => Auction;
}
