import { AWSError } from 'aws-sdk';
import * as Lambda from 'aws-sdk/clients/lambda';

export interface IInvokeParams {
  FunctionName: string;
  Payload: object;
}

export interface IContext {
  functionName: string;
}

export type Callback<T> = (error: Error | null, result: T | null) => void;
export type InvokeCallback = (err: AWSError | null, data: Lambda.Types.InvocationResponse | null) => void;
export type LambdaFunction<T> = (event: object, context: IContext, callback: Callback<T>) => void;
