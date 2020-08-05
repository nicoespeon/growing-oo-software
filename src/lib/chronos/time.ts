export { Time, TimeUnit };

class Time {
  constructor(private value: number, private unit: TimeUnit) {}

  get milliseconds(): number {
    switch (this.unit) {
      case "week":
        return this.value * 7 * 24 * 60 * 60 * 1000;

      case "day":
        return this.value * 24 * 60 * 60 * 1000;

      case "hour":
        return this.value * 60 * 60 * 1000;

      case "minute":
        return this.value * 60 * 1000;

      case "second":
        return this.value * 1000;

      default:
        return this.value;
    }
  }

  get isZero(): boolean {
    return this.value === 0;
  }

  minus(time: Time): Time {
    const value = Math.max(this.milliseconds - time.milliseconds, 0);
    return new Time(value, "millisecond");
  }
}

type TimeUnit = "millisecond" | "second" | "minute" | "hour" | "day" | "week";
