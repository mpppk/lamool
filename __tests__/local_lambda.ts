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
    const payload = JSON.parse(result!.Payload as string);
    expect(payload.message).toBe('hello world');
    done();
  });
});

it('return values via return syntax', (done) => {
  const localLambda = new LocalLambda();
  localLambda.createFunction('hello', () => {
    return {message: 'hello world'};
  });

  localLambda.invoke({ FunctionName: 'hello', Payload: {} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    const payload = JSON.parse(result!.Payload as string);
    expect(payload.message).toBe('hello world');
    done();
  });
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
    const newPayload = JSON.parse(result!.Payload as string);
    expect(newPayload.message).toBe(Payload.message);
    done();
  });
});

it('return error as payload if lambda function return error via callback', (done) => {
  const localLambda = new LocalLambda();
  const errorMessage = 'error for test';
  localLambda.createFunction('hello', (event, _context, callback) => {
    callback(new Error((event as any).errorMessage), null); // FIXME
  });

  localLambda.invoke({ FunctionName: 'hello', Payload: {errorMessage} }, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    expect(result!.FunctionError).toBe('Handled');
    expect(typeof result!.Payload).toBe('string');
    try {
      const payload = JSON.parse(result!.Payload as string);
      expect(payload.errorType).toBe('Error');
      expect(payload.errorMessage).toBe(errorMessage);
      done();
    } catch(e) {
      fail(e);
      done();
    }
  });
});

it('return error as payload if lambda function reject promise', (done) => {
  const localLambda = new LocalLambda();
  localLambda.createFunction('hello', (event) => {
    throw new Error((event as any).errorMessage)
  });

  const Payload = {errorMessage: 'error for test'}; // tslint:disable-line

  localLambda.invoke({ FunctionName: 'hello', Payload}, (err, result) => {
    if (err) {
      fail(err);
    }
    if (!result || !result.Payload) {
      fail('payload does not exist');
    }
    const newPayload = JSON.parse(result!.Payload as string);
    expect(newPayload.errorMessage).toBe(Payload.errorMessage);
    done();
  });
});

it('return error if invoke nonexistent function', (done) => {
  const localLambda = new LocalLambda();

  localLambda.invoke({ FunctionName: 'nonexistent', Payload: {}}, (err) => {
    if (!err) {
      fail('nonexistent function invoking must return ResourceNotFoundException');
      done();
    }
    expect(err!.name).toBe('ResourceNotFoundException');
    expect(err!.message).toEqual(expect.stringContaining('Function not found: arn:aws:lambda:'));
    expect(err!.statusCode).toEqual(404);
    done();
  });
});
