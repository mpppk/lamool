import { CreateFunctionRequest } from 'aws-sdk/clients/lambda';
import { LocalLambda } from '../src';
import { LambdaFunction } from '../src/lambda';
import { funcToZip } from '../src/util';
import { createFunction } from './util/util';
jest.setTimeout(10000);
const generateCreateFunctionRequest = <T, U>(name: string, handler: LambdaFunction<T, U>): CreateFunctionRequest => { // tslint:disable-line
   return {
     Code: {ZipFile: funcToZip(handler)},
     FunctionName: name,
     Handler: 'index.handler',
     Role: '-',
     Runtime: 'nodejs8.10',
  };
};

describe('local lambda', () => {
  let localLambda: LocalLambda;

  beforeEach(() => {
    localLambda = new LocalLambda();
  });

  afterEach(async () => {
    await localLambda.terminate(true);
  });

  it('return values via callback', async (done) => {
    await createFunction(localLambda, generateCreateFunctionRequest('hello', (_event, _context, callback) => {
      callback(null, { message: 'hello world' });
    }));

    localLambda.invoke({ FunctionName: 'hello' }, (err, result) => {
      if (err) {
        fail(err);
      }
      if (!result) {
        fail('result does not returned');
      }
      if (result!.FunctionError === 'Handled') {
        fail('function error is handled: ' + result!.Payload);
      }
      if (!result!.Payload) {
        fail('payload does not exist: ' + result ? JSON.stringify(result!) : '');
      }
      const payload = JSON.parse(result!.Payload as string);
      expect(payload.message).toBe('hello world');
      done();
    });
  });

  it('return values via return syntax', async (done) => {
    await createFunction(localLambda, generateCreateFunctionRequest('hello', () => {
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
    await createFunction(localLambda, generateCreateFunctionRequest('hello', (event, _context, callback) => {
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
    const errorMessage = 'error for test';
    await createFunction(localLambda, generateCreateFunctionRequest('hello', (event, _context, callback) => {
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
    await createFunction(localLambda, generateCreateFunctionRequest('hello', (event) => {
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

  it('validate handler', async () => {
    const createFunctionRequest: CreateFunctionRequest = {
      ...generateCreateFunctionRequest('handler validation test', () => {}), // tslint:disable-line
      Handler: undefined as any,
    };
    await expect(createFunction(localLambda, createFunctionRequest)).rejects.toThrow('Handler must be specified'); // FIXME message undefined
  });
});

