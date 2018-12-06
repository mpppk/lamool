import { CreateFunctionRequest, InvocationRequest, Types } from 'aws-sdk/clients/lambda';
import * as Lambda from 'aws-sdk/clients/lambda';
import { Callback, IInvokeParams, InvokeCallback } from './lambda';
import { LocalLambda } from './local_lambda';

export interface ILamoolOption {
  lambda: Lambda;
}

export class Lamool {
  private readonly lambda: Lambda | null = null;
  private readonly localLambda: LocalLambda;

  constructor(opt?: Partial<ILamoolOption>) {
    if (opt && opt.lambda) {
      this.lambda = opt.lambda;
    }
    this.localLambda = new LocalLambda();
  }

  public createFunction(params: CreateFunctionRequest, callback?: Callback<Types.FunctionConfiguration>) {
    if (this.lambda) {
      this.createFunctionOnLambda(params, callback);
      return;
    }
    this.localLambda.createFunction(params, callback);
  }

  public invoke(params: IInvokeParams, callback: InvokeCallback) {
    if (this.lambda) {
      this.invokeOnLambda(params, callback);
      return;
    }
    this.localLambda.invoke(params, callback);
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
}

export const requireFromString = (code: string): any => {
  const wrapperFuncCode = 'const module = {exports: {}};' +
    'const exports = module.exports;' +
    code + '; return module.exports;';
  return Function( wrapperFuncCode)();
};

export const requireFromURL = async (url: string): Promise<any> => {
  const res = await fetch(url);
  if (!res.body) {
    throw new Error('failed to require from ' + url);
  }
  return requireFromString(await res.text());
};
