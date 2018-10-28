import { Lamool, requireFromString } from '../src/lamool';

it('execute lamool', (done) => {
  const lamool = new Lamool();
  lamool.createFunction('hello', (_event, _context, callback) => {
    callback(null, { message: 'hello world' });
  });

  lamool.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    const payload = JSON.parse(result.Payload as string);
    expect(payload.message).toBe('hello world');
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

it('fetch function from requireFromString and pass to lamool', (done) => {
  const lamool = new Lamool();
  const {handler} = requireFromString(`module.exports.handler = (_e, _c, cb) => {cb(null, {message: 'hello world'})}`);
  lamool.createFunction('hello', handler);

  lamool.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    const payload = JSON.parse(result.Payload as string);
    expect(payload.message).toBe('hello world');
    done();
  });
});
