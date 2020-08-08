import { AuctionSniper } from "./auction-sniper";
import { SniperStateDisplayer } from "./sniper-state-displayer";
import { AuctionHouse } from "./auction";
import { XMPPAuctionHouse } from "./xmpp-auction-house";

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
