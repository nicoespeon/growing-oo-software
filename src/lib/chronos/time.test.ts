import { Time } from "./time";

describe("Time", () => {
  it("should substract times (same unit)", () => {
    const twelveMs = new Time(12, "millisecond");
    const fourMs = new Time(4, "millisecond");

    const result = twelveMs.minus(fourMs);

    expect(result.milliseconds).toBe(8);
  });

  it("should substract times (different units)", () => {
    const oneSecond = new Time(1, "second");
    const fourMs = new Time(40, "millisecond");

    const result = oneSecond.minus(fourMs);

    expect(result.milliseconds).toBe(960);
  });

  it("should not go below 0", () => {
    const twelveMs = new Time(12, "millisecond");
    const fourMs = new Time(4, "millisecond");

    const result = fourMs.minus(twelveMs);

    expect(result.isZero).toBe(true);
  });

  describe("time in milliseconds", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "millisecond");

      expect(time.milliseconds).toBe(123);
    });
  });

  describe("time in seconds", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "second");

      expect(time.milliseconds).toBe(123000);
    });
  });

  describe("time in minutes", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "minute");

      expect(time.milliseconds).toBe(7380000);
    });
  });

  describe("time in hours", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "hour");

      expect(time.milliseconds).toBe(442800000);
    });
  });

  describe("time in days", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "day");

      expect(time.milliseconds).toBe(10627200000);
    });
  });

  describe("time in weeks", () => {
    it("should have correct milliseconds", () => {
      const time = new Time(123, "week");

      expect(time.milliseconds).toBe(74390400000);
    });
  });
});
