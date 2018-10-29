import { AWSError } from 'aws-sdk';
import { InvocationResponse } from 'aws-sdk/clients/lambda';
import * as workerpool from 'workerpool';
import { WorkerPool } from 'workerpool';
import { IContext, IInvokeParams, InvokeCallback, LambdaFunction } from './lambda';

export class LocalLambda {
  private funcMap = new Map<string, LambdaFunction<any>>();
  private readonly pool: WorkerPool;

  constructor() {
    this.pool = workerpool.pool();
  }

  public createFunction<T>(name: string, func: LambdaFunction<T>): boolean {
    if (this.funcMap.has(name)) {
      return false;
    }
    this.funcMap.set(name, func);
    return true;
  }

  public invoke(params: IInvokeParams, callback: InvokeCallback) {
    if (!this.funcMap.has(params.FunctionName)) {
      throw new Error('function not found');
    }
    const func = this.funcMap.get(params.FunctionName)!;

    const wrappedFunc = (funcStr: string, event: object, context: IContext): Promise<any> => {
      const f: LambdaFunction<any> = new Function('return ' + funcStr)();
      return new Promise((resolve, reject) => {
        f(event, context, (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        });
      });
    };

    this.pool
      .exec(wrappedFunc, [func.toString(), params.Payload, { functionName: params.FunctionName }])
      .then(results => callback(null, toInvocationResponse(results)), err => callback(toAWSError(err), toInvocationResponse(null)));
  }

  public hasAvailableWorker(): boolean {
    return true;
  }
}

const toAWSError = (err: Error): AWSError => {
  const stack = err.stack ? err.stack : '';
  const _stack = stack.split("\n");
  _stack.shift();
  for (let i =0; i < _stack.length; i++){_stack[i] = _stack[i].trim().substr(3);}
  return {
    cfId: 'dummy',
    code: 'dummy',
    extendedRequestId: 'dummy',
    hostname: 'dummy',
    message: err.message,
    name: err.name,
    region: 'dummy',
    requestId: 'dummy',
    retryDelay: -1,
    retryable: true,
    statusCode: -1,
    time: new Date(),
  };
};

const toInvocationResponse = (data: any): InvocationResponse => {
  const res: InvocationResponse = {StatusCode: 200};
  if (data) {
    res.Payload = JSON.stringify(data);
  }
  return res;
};
