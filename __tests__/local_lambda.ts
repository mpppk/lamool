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

it('return values via return syntax', () => {
  // TODO
});

it('can handle event payload', (done) => {
  const localLambda = new LocalLambda();
  localLambda.createFunction('hello', (event, _context, callback) => {
    callback(null, { message: (event as any).message });
  });

  const Payload = {message: 'hello'}; // tslint:disable-line

  localLambda.invoke({ FunctionName: 'hello', Payload}, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    const newPayload = JSON.parse(result.Payload as string);
    expect(newPayload.message).toBe(Payload.message);
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

it('return error as payload if lambda function reject promise', () => {
  // TODO
});

it('return error if lambda function has syntax error', () => {
  // TODO
});
