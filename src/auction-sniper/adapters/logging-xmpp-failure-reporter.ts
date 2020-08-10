import { FailureReporter } from "./auction-message-translator";

export { LoggingXMPPFailureReporter, Logger };

class LoggingXMPPFailureReporter implements FailureReporter {
  constructor(private logger: Logger) {}

  cannotTranslateMessage(
    auctionId: string,
    failedMessage: string,
    error: Error
  ) {
    this.logger.severe(
      `<${auctionId}> Could not translate message "${failedMessage}" because "${error}"`
    );
  }
}

interface Logger {
  severe: (message: string) => void;
}
