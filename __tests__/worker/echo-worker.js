const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => {
  if (msg === 'exit') {
    process.exit();
  } else {
    parentPort.postMessage(msg);
  }
});
