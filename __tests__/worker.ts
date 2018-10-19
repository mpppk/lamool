import * as path from 'path';
import { UniversalWorker } from '../src/worker';

it('can execute in nodejs', (done) => {
  const worker = new UniversalWorker(
    'worker/echo-worker.js',
    {root: path.join(process.cwd(), '__tests__')});
  const message = 'hello from main thread';

  worker.onmessage((msg) => {
    expect(msg).toBe(message);
    worker.postMessage('exit');
    done();
  });

  worker.postMessage(message);
});
