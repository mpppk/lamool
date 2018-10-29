import { InvocationRequest } from 'aws-sdk/clients/lambda';
import * as Lambda from 'aws-sdk/clients/lambda';
import { IInvokeParams, InvokeCallback } from './lambda';
import { LocalLambda } from './local_lambda';

export interface ILamoolOption {
  offloadToLambda: boolean;
}

export class Lamool {
  private readonly lambda: Lambda | null = null;
  private readonly localLambda: LocalLambda;
  private readonly opt: Partial<ILamoolOption>;

  constructor(opt?: Partial<ILamoolOption>) {
    this.opt = opt || {};
    if (this.opt.offloadToLambda) {
      this.lambda = new Lambda({apiVersion: '2015-03-31'});
    }
    this.localLambda = new LocalLambda();
  }

  public invoke(params: IInvokeParams, callback: InvokeCallback) {
    if (this.opt.offloadToLambda && !this.localLambda.hasAvailableWorker()) {
      this.invokeOnLambda(params, callback);
      return;
    }
    this.localLambda.invoke(params, callback);
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
