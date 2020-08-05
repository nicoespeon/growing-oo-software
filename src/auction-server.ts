export interface AuctionServer {
  XMPP_HOST_NAME: string;
  itemId: string;
  startSellingItem: () => void;
  hasReceivedJoinRequestFromSniper: () => Promise<void>;
  announceClosed: () => void;
  stop: () => void;
}
