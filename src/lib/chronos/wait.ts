import { Time } from "./time";

export { wait };

async function wait(time: Time): Promise<void>;
async function wait<T>(time: Time, callback: () => T): Promise<T>;
async function wait(time: Time, callback?: any): Promise<any> {
  if (!callback) callback = () => {};

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(callback());
      } catch (error) {
        reject(error);
      }
    }, time.milliseconds);
  });
}
