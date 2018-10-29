import { requireFromString } from '../src/lamool';
import { LocalLambda } from '../src/local_lambda';

it('return values via callback', (done) => {
  const localLambda = new LocalLambda();
  localLambda.createFunction('hello', (_event, _context, callback) => {
    callback(null, { message: 'hello world' });
  });

  localLambda.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
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

it('return error as payload if lambda function return error via callback', (done) => {
  const localLambda = new LocalLambda();
  const testError = new Error('error for test');
  localLambda.createFunction('hello', (_event, _context, callback) => {
    callback(new Error('error for test'), null); // FIXME
  });

  localLambda.invoke({ FunctionName: 'hello', Payload: {testError} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    expect(result.FunctionError).toBe('Handled');
    expect(typeof result.Payload).toBe('string');
    try {
      const payload = JSON.parse(result.Payload as string);
      expect(payload.errorType).toBe(testError.name);
      expect(payload.errorMessage).toBe(testError.message);
      done();
    } catch(e) {
      fail(e);
      done();
    }
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

it('fetch function from requireFromString and pass to LocalLambda', (done) => {
  const localLambda = new LocalLambda();
  const {handler} = requireFromString(`module.exports.handler = (_e, _c, cb) => {cb(null, {message: 'hello world'})}`);
  localLambda.createFunction('hello', handler);

  localLambda.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }

    try {
      const payload = JSON.parse(result.Payload as string);
      expect(payload.message).toBe('hello world');
      done();
    } catch(e) {
      fail(e);
    }
  });
});
