import { Time, wait } from "../chronos";

export { BlockingQueue };

/**
 * A bounded blocking queue.
 *
 * Elements are ordered FIFO (first-in-first-out). Head of the queue is the element that has been on the queue the longest time. Tail of the queue is the element that has been on the queue the shortest time.
 *
 * This queue is a "bounded buffer": it holds a fixed capacity of elements. Once created, the capacity cannot be changed.
 *
 * Attempts to add an element into a full queue will throw; attempts to poll an element from an empty queue will block until one is available or the poll times out.
 *
 * Inspired from https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ArrayBlockingQueue.html
 */
class BlockingQueue<Element> {
  private queue: Array<Element> = [];
  private static POLL_INTERVAL = new Time(5, "millisecond");

  constructor(private capacity: number) {}

  add(element: Element): void {
    if (this.remainingCapacity <= 0) {
      throw new DetailedError("Queue is full", {
        queueCapacity: this.capacity,
        value: element,
      });
    }

    this.queue.push(element);
  }

  get remainingCapacity(): number {
    return this.capacity - this.size;
  }

  get size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  poll(): Element | null;
  async poll(time: Time): Promise<Element | null>;
  poll(...args: [] | [Time]): Element | null | Promise<Element | null> {
    const time = args[0];

    if (!time) {
      return this.queue.shift() || null;
    }

    if (this.size > 0) {
      return this.queue.shift() || null;
    }

    if (time.milliseconds === 0) {
      return this.queue.shift() || null;
    }

    return wait(BlockingQueue.POLL_INTERVAL).then(() =>
      this.poll(time.minus(BlockingQueue.POLL_INTERVAL))
    );
  }
}

class DetailedError extends Error {
  constructor(message: string, public readonly details: { [k: string]: any }) {
    super(message);
  }
}
