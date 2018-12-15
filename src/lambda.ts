import { AWSError } from 'aws-sdk';
import * as Lambda from 'aws-sdk/clients/lambda';

export interface IInvokeParams {
  FunctionName: string;
  Payload?: string;
}

export interface IContext {
  functionName: string;
}

export type Callback<T = IPayload> = (error: Error | null, result: T | null) => void;
export type InvokeCallback = (err: AWSError | null, data: Lambda.Types.InvocationResponse | null) => void;
export type LambdaFunction<T = IPayload, U = T> = (event: T, context: IContext, callback: Callback<U>) => void;
export interface IPayload {[key: string]: any}

