import { Lamool, LocalLambda } from '../src';
import { createFunction, generateCreateFunctionRequest } from './util/util';

describe('lamool.invoke', () => {
  let lamool: Lamool;
  beforeEach(() => {
    lamool = new Lamool();
  });

  afterEach(async () => {
    await lamool.terminate(true);
  });

  it('return values via callback', async done => {
    await createFunction(
      (lamool as any) as LocalLambda, // FIXME
      generateCreateFunctionRequest('hello', () => {
        return { message: 'hello world' };
      })
    );

    lamool.invoke({ FunctionName: 'hello' }, (err, result) => {
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

  it('return InvocationAcceptanceResult', async () => {
    await createFunction(
      (lamool as any) as LocalLambda, // FIXME
      generateCreateFunctionRequest('hello', () => {
        return { message: 'hello world' };
      })
    );

    const emptyHandler = () => {}; // tslint:disable-line no-empty
    const result = lamool.invoke({ FunctionName: 'hello' }, emptyHandler);
    expect(result).toEqual({ environment: 'local' });
  });
});
