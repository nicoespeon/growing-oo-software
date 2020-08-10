import * as fs from "fs";
import { Connection as XMPPConnection } from "../../lib/xmpp";
import { Auction, AuctionHouse } from "../domain/auction";
import { XMPPAuction } from "./xmpp-auction";
import { Item } from "../domain/item";
import {
  LoggingXMPPFailureReporter,
  Logger,
} from "./logging-xmpp-failure-reporter";
import { FailureReporter } from "./auction-message-translator";

export { XMPPAuctionHouse, FileLogger };

class XMPPAuctionHouse implements AuctionHouse {
  static readonly SNIPER_XMPP_ID = "Sniper 1245";

  private failureReporter: FailureReporter;

  constructor(private connection: XMPPConnection) {
    this.failureReporter = new LoggingXMPPFailureReporter(new FileLogger());
  }

  static connect(
    hostName: string,
    username: string,
    password: string
  ): XMPPAuctionHouse {
    const connection = new XMPPConnection(hostName, this.SNIPER_XMPP_ID);
    connection.connect();
    connection.login(username, password, XMPPAuction.AUCTION_RESOURCE);

    return new XMPPAuctionHouse(connection);
  }

  auctionFor(item: Item): Auction {
    return new XMPPAuction(
      this.connection,
      item.identifier,
      this.failureReporter
    );
  }
}

class FileLogger implements Logger {
  static readonly LOG_FILE_NAME = "auction-sniper.log";

  severe(message: string) {
    fs.writeFileSync(FileLogger.LOG_FILE_NAME, message, "utf-8");
  }
}
