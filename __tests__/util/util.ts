import { LocalLambda } from '../../src';
import { CreateFunctionRequest } from 'aws-sdk/clients/lambda';

export const createFunction = async (lambda: LocalLambda, req: CreateFunctionRequest) => {
  return new Promise((resolve, reject) => {
    lambda.createFunction(req, (err, result) => {
      if (err) { reject(err) }
      if (!result) { resolve() }
      resolve(result!);
    });
  });
};
