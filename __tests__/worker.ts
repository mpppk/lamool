import * as path from 'path';
import { UniversalWorker } from '../src/worker';

it('can execute in nodejs', (done) => {
  const worker = new UniversalWorker(path.join(__dirname, 'worker/echo-worker.js'));
  const message = 'hello from main thread';

  worker.on('message', (msg) => {
    expect(msg).toBe(message);
    worker.postMessage('exit');
    done();
  });

  worker.postMessage(message);
});
