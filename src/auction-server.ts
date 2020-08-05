export interface AuctionServer {
  XMPP_HOST_NAME: string;
  itemId: string;
  startSellingItem: () => void;
  reportPrice: (price: number, increment: number, bidder: string) => void;
  announceClosed: () => void;
  stop: () => void;
}
