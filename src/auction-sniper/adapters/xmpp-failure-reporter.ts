import { FailureReporter } from "./auction-message-translator";

export { XMPPFailureReporter };

class XMPPFailureReporter implements FailureReporter {
  cannotTranslateMessage(
    auctionId: string,
    failedMessage: string,
    error: Error
  ) {
    // TODO: implement
  }
}
