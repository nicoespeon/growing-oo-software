import { AuctionSniper } from "./domain/auction-sniper";
import { SniperStateDisplayer } from "./adapters/sniper-state-displayer";
import { AuctionHouse } from "./domain/auction";
import { XMPPAuctionHouse } from "./adapters/xmpp-auction-house";

export { Main };

class Main {
  static main(
    hostName: string,
    sniperUsername: string,
    sniperPassword: string,
    itemId: string
  ): void {
    const main = new Main();
    const auctionHouse = XMPPAuctionHouse.connect(
      hostName,
      sniperUsername,
      sniperPassword
    );
    main.joinAuction(auctionHouse, itemId);
  }

  private joinAuction(auctionHouse: AuctionHouse, itemId: string) {
    const auction = auctionHouse.auctionFor(itemId);
    auction.addAuctionEventListener(
      new AuctionSniper(auction, new SniperStateDisplayer(itemId), itemId)
    );
    auction.join();
  }
}
