import { wait } from "./wait";
import { Time } from "./time";

describe("wait", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => jest.clearAllTimers());

  it("should have executed callback after given time", () => {
    const spy = jest.fn();

    wait(new Time(200, "millisecond"), () => spy());

    jest.runTimersToTime(200);
    expect(spy).toHaveBeenCalled();
  });

  it("should not have executed callback before given time", async () => {
    const spy = jest.fn();

    wait(new Time(200, "millisecond"), () => spy());

    jest.runTimersToTime(199);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should return a promise that can be awaited", async () => {
    jest.useRealTimers();
    const spy = jest.fn();

    await wait(new Time(50, "millisecond"), () => spy());

    expect(spy).toHaveBeenCalled();
  });

  it("should reject if callback throws", async () => {
    jest.useRealTimers();
    const error = new Error("irrelevant");

    await expect(
      wait(new Time(50, "millisecond"), () => {
        throw error;
      })
    ).rejects.toThrow(error);
  });
});
