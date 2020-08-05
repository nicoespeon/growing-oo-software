export interface AuctionServer {
  XMPP_HOST_NAME: string;
  itemId: string;
  startSellingItem: () => void;
  announceClosed: () => void;
  stop: () => void;
}
