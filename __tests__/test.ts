import { Lamool } from '../src/lamool';

interface IMessage {
  message: string;
}

it('execute lamool', (done) => {
  const lamool = new Lamool();
  lamool.createFunction('hello', (_event, _context, callback) => {
    callback(null, { message: 'hello world' });
  });

  lamool.invoke({ FunctionName: 'hello', Payload: {} }, (err, result: IMessage | null) => {
    if (err) {
      fail(err);
    }
    expect(result!.message).toBe('hello world');
    done();
  });
});
