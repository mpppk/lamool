import { requireFromString } from '../src/lamool';
import { LocalLambda } from '../src/local_lambda';

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

it('fetch function from requireFromString and pass to LocalLambda', (done) => {
  const localLambda = new LocalLambda();
  const {handler} = requireFromString(`module.exports.handler = (_e, _c, cb) => {cb(null, {message: 'hello world'})}`);
  localLambda.createFunction({
    Code: {},
    FunctionBody: handler,
    FunctionName: 'hello',
    Handler: 'hoge.fuga',
    Role: '-',
    Runtime: 'nodejs8.10',
  });

  localLambda.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }

    try {
      const payload = JSON.parse(result!.Payload as string);
      expect(payload.message).toBe('hello world');
      done();
    } catch(e) {
      fail(e);
    }
  });
});
