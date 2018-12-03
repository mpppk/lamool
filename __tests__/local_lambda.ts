import { CreateFunctionRequest } from 'aws-sdk/clients/lambda';
import { LocalLambda } from '../src';
import { LambdaFunction } from '../src/lambda';
import { funcToZip } from '../src/util';

const generateCreateFunctionRequest = <T>(name: string, handler: LambdaFunction<T>): CreateFunctionRequest => { // tslint:disable-line
   return {
     Code: {ZipFile: funcToZip(handler)},
     FunctionName: name,
     Handler: 'index.handler',
     Role: '-',
     Runtime: 'nodejs8.10',
  };
};

it('return values via callback', async (done) => {
  const localLambda = new LocalLambda();
  await localLambda.createFunction(generateCreateFunctionRequest('hello', (_event, _context, callback) => {
    callback(null, { message: 'hello world' });
  }));

  localLambda.invoke({ FunctionName: 'hello' }, (err, result) => {
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

it('return values via return syntax', async (done) => {
  const localLambda = new LocalLambda();
  await localLambda.createFunction(generateCreateFunctionRequest('hello', () => {
    return { message: 'hello world' };
  }));

  localLambda.invoke({ FunctionName: 'hello'}, (err, result) => {
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

it('can handle event payload', async (done) => {
  const localLambda = new LocalLambda();
  await localLambda.createFunction(generateCreateFunctionRequest('hello', (event, _context, callback) => {
    callback(null, { message: (event as any).message });
  }));

  const Payload = {message: 'hello'}; // tslint:disable-line

  localLambda.invoke({ FunctionName: 'hello', Payload: JSON.stringify(Payload)}, (err, result) => {
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

it('return error as payload if lambda function return error via callback', async (done) => {
  const localLambda = new LocalLambda();
  const errorMessage = 'error for test';
  await localLambda.createFunction(generateCreateFunctionRequest('hello', (event, _context, callback) => {
    callback(new Error((event as any).errorMessage), null); // FIXME
  }));

  localLambda.invoke({ FunctionName: 'hello', Payload: JSON.stringify({errorMessage}) }, (err, result) => {
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

it('return error as payload if lambda function reject promise', async (done) => {
  const localLambda = new LocalLambda();
  await localLambda.createFunction(generateCreateFunctionRequest('hello', (event) => {
    throw new Error((event as any).errorMessage);
  }));

  const Payload = {errorMessage: 'error for test'}; // tslint:disable-line

  localLambda.invoke({ FunctionName: 'hello', Payload: JSON.stringify(Payload)}, (err, result) => {
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

  localLambda.invoke({ FunctionName: 'nonexistent' }, (err) => {
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
