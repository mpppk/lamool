import { UniversalWorker } from './worker';

const worker = new UniversalWorker('echo-worker.js');
const message = 'hello from main thread';

worker.onmessage( (e) => {
  console.log('main thread received message from web worker:', e.data);
  worker.postMessage('exit');
});

worker.postMessage(message);
