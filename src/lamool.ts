import { CreateFunctionRequest, InvocationRequest, ListFunctionsRequest, Types } from 'aws-sdk/clients/lambda';
import * as Lambda from 'aws-sdk/clients/lambda';
import axios from 'axios';
import { WorkerPoolOptions, WorkerPoolStats } from 'workerpool';
import * as workerpool from 'workerpool';
import { Callback, IInvokeParams, InvokeCallback, ListFunctionsCallback } from './lambda';
import { LocalLambda } from './local_lambda';

export interface ILamoolContext {
  stats: WorkerPoolStats;
}

type strategyFunc = (context: ILamoolContext) => boolean;

export interface ILamoolOption {
  lambda: Lambda;
  strategy: strategyFunc;
  workerPool: WorkerPoolOptions;
}

export class Lamool {
  public static alwaysRunLocal(_: ILamoolContext): boolean {
    return true;
  }

  public static alwaysRunAWSLambda(_: ILamoolContext): boolean {
    return false;
  }

  public static generatePrioritizeLocalStrategyFunc(allowPendingTaskNum: number): strategyFunc {
    return (context: ILamoolContext): boolean => context.stats.pendingTasks <= allowPendingTaskNum;
  }

  private readonly lambda: Lambda | null = null;
  private readonly localLambda: LocalLambda;
  private readonly strategy: strategyFunc;

  constructor(opt?: Partial<ILamoolOption>) {
    this.strategy = Lamool.alwaysRunLocal;
    if (opt && opt.lambda) {
      this.lambda = opt.lambda;
      this.strategy = Lamool.generatePrioritizeLocalStrategyFunc(0);
    }

    if (opt && opt.strategy) {
      this.strategy = opt.strategy;
    }

    const workerPoolOpt = opt ? opt.workerPool : undefined;
    this.localLambda = new LocalLambda(workerPoolOpt);
  }

  public createFunction(params: CreateFunctionRequest, callback?: Callback<Types.FunctionConfiguration>) {
    const internalCallback: Callback<Types.FunctionConfiguration> = (err, result) => {
      if (err && callback) {
        callback(err, result);
      }

      if (!this.lambda) {
        if (callback) {
          callback(err, result);
        }
        return;
      }
      this.createFunctionOnLambda(params, callback);
    };

    this.localLambda.createFunction(params, internalCallback);
  }

  public invoke(params: IInvokeParams, callback: InvokeCallback) {
    if (this.checkFunctionShouldBeRunLocal()) {
      this.localLambda.invoke(params, callback);
      return;
    }
    this.invokeOnLambda(params, callback);
  }

  public listFunctions(params: ListFunctionsRequest, callback: ListFunctionsCallback) {
    if (this.checkFunctionShouldBeRunLocal()) {
      this.localLambda.listFunctions(params, callback);
      return;
    }

    if (!this.lambda) {
      throw new Error('lambda is not available');
    }

    this.lambda.listFunctions(params, callback);
  }

  public terminate(force?: boolean, timeout?: number): workerpool.Promise<any[]> {
    return this.localLambda.terminate(force, timeout);
  }

  private createFunctionOnLambda(params: CreateFunctionRequest, callback?: Callback<Types.FunctionConfiguration>) {
    if (!this.lambda) {
      throw new Error('lambda is not available');
    }
    this.lambda.createFunction(params, callback);
  }

  private invokeOnLambda(params: InvocationRequest, callback: InvokeCallback) {
    if (!this.lambda) {
      throw new Error('lambda is not available');
    }
    this.lambda.invoke(params, callback);
  }

  private checkFunctionShouldBeRunLocal(): boolean {
    if (!this.lambda) {
      return true;
    }
    return this.strategy({stats: this.localLambda.stats()});
  }
}

export const requireFromString = (code: string): any => {
  const wrapperFuncCode = 'const module = {exports: {}};' +
    'const exports = module.exports;' +
    code + '; return module.exports;';
  return Function( wrapperFuncCode)();
};

export const requireFromURL = async (url: string): Promise<any> => {
  const res = await axios.get(url);
  if (!res.data) {
    throw new Error('failed to require from ' + url);
  }
  return requireFromString(await res.data);
};
