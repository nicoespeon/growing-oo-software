import { Time, wait } from "../chronos";
import { BlockingQueue } from "./blocking-queue";

describe("BlockingQueue", () => {
  const ANY_ELEMENT = "irrelevant";
  const LARGE_CAPACITY = 99999;

  beforeEach(() => {
    jest.setTimeout(5000);
  });

  it("should throw if we add an element but queue is full", () => {
    const queue = new BlockingQueue(0);

    expect(() => queue.add(ANY_ELEMENT)).toThrow();
  });

  it("should not throw if we add an element and queue isn't full", () => {
    const queue = new BlockingQueue(2);

    expect(() => {
      queue.add(ANY_ELEMENT);
      queue.add(ANY_ELEMENT);
    }).not.toThrow();
  });

  it("should return the queue remaining capacity after we added elements", () => {
    const queue = new BlockingQueue(LARGE_CAPACITY);

    queue.add(ANY_ELEMENT);
    queue.add(ANY_ELEMENT);

    expect(queue.remainingCapacity).toBe(LARGE_CAPACITY - 2);
  });

  it("should return the queue size", () => {
    const queue = new BlockingQueue(LARGE_CAPACITY);

    queue.add(ANY_ELEMENT);
    queue.add(ANY_ELEMENT);

    expect(queue.size).toBe(2);
  });

  it("should clear all elements in the queue", () => {
    const queue = new BlockingQueue(LARGE_CAPACITY);

    queue.add(ANY_ELEMENT);
    queue.add(ANY_ELEMENT);
    queue.clear();

    expect(queue.size).toBe(0);
  });

  describe("polling a queue", () => {
    const FIRST_ELEMENT = "first";
    const SECOND_ELEMENT = "second";

    it("should retrieve the head of queue", () => {
      const queue = new BlockingQueue(LARGE_CAPACITY);

      queue.add(FIRST_ELEMENT);
      queue.add(SECOND_ELEMENT);
      const result = queue.poll();

      expect(result).toBe(FIRST_ELEMENT);
    });

    it("should remove the head of queue", () => {
      const queue = new BlockingQueue(LARGE_CAPACITY);

      queue.add(FIRST_ELEMENT);
      queue.add(SECOND_ELEMENT);
      queue.poll();

      expect(queue.size).toBe(1);
    });

    it("should return null if queue is empty", () => {
      const queue = new BlockingQueue(LARGE_CAPACITY);

      const result = queue.poll();

      expect(result).toBeNull();
    });

    it("should wait up to given wait time for an element to become available", async () => {
      const queue = new BlockingQueue(LARGE_CAPACITY);

      const [_, result] = await Promise.all([
        wait(new Time(100, "millisecond"), () => queue.add(FIRST_ELEMENT)),
        queue.poll(new Time(200, "millisecond")),
      ]);

      expect(result).toBe(FIRST_ELEMENT);
    });

    it("should return null if there's still no element available after given wait time", async () => {
      const queue = new BlockingQueue(LARGE_CAPACITY);

      const [_, result] = await Promise.all([
        wait(new Time(300, "millisecond"), () => queue.add(FIRST_ELEMENT)),
        queue.poll(new Time(200, "millisecond")),
      ]);

      expect(result).toBe(null);
    });

    it("should return immediately when element becomes available", async () => {
      // We don't need to wait long
      jest.setTimeout(500);
      const queue = new BlockingQueue(LARGE_CAPACITY);

      const [_, result] = await Promise.all([
        wait(new Time(100, "millisecond"), () => queue.add(FIRST_ELEMENT)),
        queue.poll(new Time(20, "second")),
      ]);

      expect(result).toBe(FIRST_ELEMENT);
    });
  });
});
