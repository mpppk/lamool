const isNode = () => {
  return typeof process !== "undefined" && typeof require !== "undefined";
};

const hasNodejsWorker = () => {
  if (!process || !process.versions || !process.versions.node) {
    return false;
  }
  const [major, minor] = process.versions.node.split('.');
  return parseInt(major, 10) >= 10 && parseInt(minor, 10) >= 5;
};

const hasWebWorker = () => {
  return !!(Worker);
};

if (isNode() && hasNodejsWorker()) {
  const { parentPort } = require('worker_threads');
  parentPort.on('message', (msg) => {
    if (msg === 'exit') {
      process.exit();
    } else {
      parentPort.postMessage(msg);
    }
  });
} else if(hasWebWorker()) {
  onmessage = function(msg) {
    if (msg === 'exit') {
      process.exit();
    } else {
      postMessage(msg);
    }
  }
}

