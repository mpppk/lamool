import * as workerpool from 'workerpool';
import { WorkerPool } from 'workerpool';
export interface IInvokeParams {
  FunctionName: string;
  Payload: object;
}

export interface IContext {
  functionName: string;
}

type Callback<T> = (error: Error | null, result: T | null) => void;
type LambdaFunction<T> = (event: object, context: IContext, callback: Callback<T>) => void;

export class Lamool {
  private funcMap = new Map<string, LambdaFunction<any>>();
  private pool: WorkerPool;

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

  public invoke<T>(params: IInvokeParams, callback: Callback<T>) {
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
      .then(results => callback(null, results), err => callback(err, null));
  }
}
