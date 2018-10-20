import * as workerpool from 'workerpool';
import { WorkerPool } from 'workerpool';
export interface IInvokeParams {
  FunctionName: string
  Payload: object
}

export interface IContext {
  functionName: string
}

type Callback<T> = (error: Error | null, result: T) => void
type LambdaFunction<T> = (event: object, context: IContext, callback: Callback<T>) => void

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
    return true
  }

  public invoke<T>(params: IInvokeParams, callback: Callback<T>) {
    if (!this.funcMap.has(params.FunctionName)) {
      throw new Error("function not found");
    }
    const func = this.funcMap.get(params.FunctionName)!;
    this.pool.exec(func, [params.Payload, {functionName: params.FunctionName}, callback]);
  }
}

