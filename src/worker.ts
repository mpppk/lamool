
export class UniversalWorker {
  private worker: any;
  constructor(filePath: string, opt?: any) {
    if (isNode() && hasNodejsWorker()) {
      const { Worker } = require('worker_threads');
      this.worker = new Worker(filePath);
      return
    }

    if (!isNode() && hasWebWorker()) {
      this.worker = new Worker(filePath);
    }
    this.worker = new PolyfillWorker();
  }

  public on(eventName: string, callback: (args: any) => void) {
    this.worker.on(eventName, callback);
  }

  public postMessage(message: string) {
    this.worker.postMessage(message);
  }

}

class PolyfillWorker { }

export const isNode = (): boolean => {
  return typeof process !== "undefined" && typeof require !== "undefined";

};

export const hasNodejsWorker = (): boolean => {
  const [major, minor, _patch] = process.versions.node.split('.');
  return parseInt(major, 10) >= 10 && parseInt(minor, 10) >= 5;
};

export const hasWebWorker = (): boolean => {
  return !isNode && Worker;
};
