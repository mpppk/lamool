import { AWSError } from 'aws-sdk';
import { Lambda } from 'aws-sdk/clients/browser_default';
import { InvocationRequest, InvocationResponse } from 'aws-sdk/clients/lambda';
import * as workerpool from 'workerpool';
import { WorkerPool } from 'workerpool';
export interface IInvokeParams {
  FunctionName: string;
  Payload: object;
}

export interface IContext {
  functionName: string;
}

export interface ILamoolOption {
  offloadToLambda: boolean;
}

type Callback<T> = (error: Error | null, result: T | null) => void;
type InvokeCallback = (err: AWSError | null, data: Lambda.Types.InvocationResponse) => void;
type LambdaFunction<T> = (event: object, context: IContext, callback: Callback<T>) => void;

export class Lamool {
  private funcMap = new Map<string, LambdaFunction<any>>();
  private readonly pool: WorkerPool;
  private readonly lambda: Lambda | null = null;
  private readonly opt: Partial<ILamoolOption>;

  constructor(opt?: Partial<ILamoolOption>) {
    this.opt = opt || {};
    if (this.opt.offloadToLambda) {
      this.lambda = new Lambda({apiVersion: '2015-03-31'});
    }
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
    if (this.opt.offloadToLambda && !this.hasAvailableWorker()) {
      this.invokeOnLambda(params, callback);
      return;
    }
    this.invokeOnWorker(params, callback);
  }

  private invokeOnLambda(params: InvocationRequest, callback: InvokeCallback) {
    if (!this.lambda) {
      throw new Error('lambda is not available');
    }
    this.lambda.invoke(params, callback);
  }

  private invokeOnWorker(params: IInvokeParams, callback: InvokeCallback) {
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

  private hasAvailableWorker(): boolean {
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
  return {
    ExecutedVersion: 'lambda',
    FunctionError: 'dummy',
    LogResult: 'dummy',
    Payload: JSON.stringify(data),
    StatusCode: -1,
  };
};

export const requireFromString = (code: string): any => {
  const wrapperFuncCode = 'const module = {exports: {}};' +
    'const exports = module.exports;' +
    code + '; return module.exports;';
  return Function( wrapperFuncCode)();
};
