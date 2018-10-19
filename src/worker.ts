export interface IUniversalWorkerOption {
  root: string;
}

export class UniversalWorker {
  private readonly worker: any;
  private readonly runtime: 'worker_threads' | 'web worker' | 'main thread';
  private readonly rootPath = process.argv[1];
  constructor(filePath: string, opt?: Partial<IUniversalWorkerOption>) {
    if (isNode() && hasNodejsWorker()) {
      const path = require('path');
      const { Worker } = require('worker_threads');

      if (opt && opt.root) {
        this.rootPath = opt.root;
      }

      this.worker = new Worker(path.join(this.rootPath, filePath));
      this.runtime = 'worker_threads';
      return
    }

    if (hasWebWorker()) {
      this.worker = new Worker(filePath);
      this.runtime = 'web worker';
      return
    }
    this.worker = new PolyfillWorker();
    this.runtime = 'main thread';
  }

  public onmessage(callback: (args: any) => void) { // FIXME
    switch(this.runtime) {
      case 'worker_threads':
        this.worker.on('message', callback);
        break;
      case 'web worker':
        this.worker.onmessage = callback;
        break;
      case 'main thread':
        this.worker.onmessage(callback);
    }
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
  if (!process || !process.versions || !process.versions.node) {
    return false;
  }
  const [major, minor] = process.versions.node.split('.');
  return parseInt(major, 10) >= 10 && parseInt(minor, 10) >= 5;
};

export const hasWebWorker = (): boolean => {
  return !!(Worker);
};
