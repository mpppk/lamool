import { CreateFunctionRequest } from 'aws-sdk/clients/lambda';
import { funcToZip, LambdaFunction, LocalLambda } from '../../src';

export const createFunction = async (lambda: LocalLambda, req: CreateFunctionRequest) => {
  return new Promise((resolve, reject) => {
    lambda.createFunction(req, (err, result) => {
      if (err) {
        reject(err);
      }
      if (!result) {
        resolve();
      }
      resolve(result!);
    });
  });
};

export const generateCreateFunctionRequest = <T, U>(
  name: string,
  handler: LambdaFunction<T, U>
): CreateFunctionRequest => {
  // tslint:disable-line
  return {
    Code: { ZipFile: funcToZip(handler) },
    FunctionName: name,
    Handler: 'index.handler',
    Role: '-',
    Runtime: 'nodejs8.10'
  };
};
