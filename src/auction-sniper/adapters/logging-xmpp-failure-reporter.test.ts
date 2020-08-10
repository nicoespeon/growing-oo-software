import {
  LoggingXMPPFailureReporter,
  Logger,
} from "./logging-xmpp-failure-reporter";

describe("LoggingXMPPFailureReporter", () => {
  it("should write message translation failure to logs", () => {
    const logger = new FakeLogger();
    const reporter = new LoggingXMPPFailureReporter(logger);

    reporter.cannotTranslateMessage(
      "auction id",
      "bad message",
      new Error("bad")
    );

    expect(logger.severe).toBeCalledTimes(1);
    expect(logger.severe).toBeCalledWith(
      `<auction id> Could not translate message "bad message" because "Error: bad"`
    );
  });
});

class FakeLogger implements Logger {
  severe = jest.fn();
}
