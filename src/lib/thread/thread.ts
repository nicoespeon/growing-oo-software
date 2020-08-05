import * as Fiber from "fibers";

export { Thread };

class Thread {
  private fiber: Fiber;

  constructor(private readonly name: string, target: Function) {
    this.fiber = Fiber(target);
  }

  start() {
    this.fiber.run();
  }
}
