import { Lamool, requireFromString } from '../src/lamool';

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

it('requireFromString: exports', () => {
  const exports = requireFromString('exports.handler = (a) => {return a+a;}');
  expect(exports.handler(3)).toBe(6);
});

it('requireFromString: module.exports', () => {
  const exports = requireFromString('module.exports.handler = (a) => {return a+a;}');
  expect(exports.handler(3)).toBe(6);
  const handler = requireFromString('module.exports = (a) => {return a+a;}');
  expect(handler(3)).toBe(6);
});
