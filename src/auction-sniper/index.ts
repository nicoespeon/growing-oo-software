import { AuctionSniper } from "./domain/auction-sniper";
import { SniperStateDisplayer } from "./adapters/sniper-state-displayer";
import { AuctionHouse } from "./domain/auction";
import { XMPPAuctionHouse } from "./adapters/xmpp-auction-house";
import { Item } from "./domain/item";

export { Main };

class Main {
  static main(
    hostName: string,
    sniperUsername: string,
    sniperPassword: string,
    itemId: string,
    stopPrice?: number
  ): void {
    const main = new Main();
    const auctionHouse = XMPPAuctionHouse.connect(
      hostName,
      sniperUsername,
      sniperPassword
    );
    const item = new Item(itemId, stopPrice);
    main.joinAuction(auctionHouse, item);
  }

  private joinAuction(auctionHouse: AuctionHouse, item: Item) {
    const auction = auctionHouse.auctionFor(item);
    auction.addAuctionEventListener(
      new AuctionSniper(
        auction,
        new SniperStateDisplayer(item.identifier),
        item
      )
    );
    auction.join();
  }
}
