import { AWSError } from 'aws-sdk';
import { CreateFunctionRequest, InvocationResponse, Types } from 'aws-sdk/clients/lambda';
import * as workerpool from 'workerpool';
import { WorkerPool } from 'workerpool';
import { Callback, IContext, IInvokeParams, InvokeCallback, LambdaFunction } from './lambda';
import { zipToFunc } from './util';

export class LocalLambda {
  private static parseHandler(handler: string): [string, string] {
    const fileAndHandlerName = handler.split('.');
    if (fileAndHandlerName.length !== 2) {
      throw new Error('invalid Handler: ' + handler);
    }
    return [fileAndHandlerName[0] + '.js', fileAndHandlerName[1]]
  }

  private funcMap = new Map<string, LambdaFunction<any>>();
  private readonly pool: WorkerPool;

  constructor() {
    this.pool = workerpool.pool();
  }

  public async createFunction(params: CreateFunctionRequest, callback?: Callback<Types.FunctionConfiguration>) {
    if (this.funcMap.has(params.FunctionName)) {
      // TODO throw exception
      return;
    }

    if (!params.Code.ZipFile) {
      throw new Error('ZipFile property does not exist');
    }

    const zipFile = params.Code.ZipFile;
    if (typeof zipFile === 'string') {
      throw new Error('ZipFile format is only accepted [Buffer | Blob]');
    }


    const [fileName, handlerName] = LocalLambda.parseHandler(params.Handler);
    const functionBody = await zipToFunc(zipFile as Blob | Buffer, fileName, handlerName); // FIXME

    this.funcMap.set(params.FunctionName, functionBody);
    if (callback) {
      callback(null, {FunctionName: params.FunctionName});
    }
  }

  public invoke(params: IInvokeParams, callback: InvokeCallback) {
    if (!this.funcMap.has(params.FunctionName)) {
      const err = new Error('Function not found: arn:aws:lambda:us-east-1:000000000000:function:noExistFunction');
      err.name = 'ResourceNotFoundException';
      callback(generateResourceNotFoundException(), null);
      return;
    }
    const func = this.funcMap.get(params.FunctionName)!;

    const wrappedFunc = (funcStr: string, event: object, context: IContext): Promise<any> => {
      const f: LambdaFunction<any> = new Function('return ' + funcStr)();
      return new Promise((resolve, reject) => {
        try {
          // TODO: Implement timeout
          const result = f(event, context, (err, res) => {
            if (err) {
              reject(err);
            }
            resolve(res);
          });
          if (result) {
            resolve(result);
          }
        } catch (e) {
          reject(e);
        }
      });
    };

    this.pool
      .exec(wrappedFunc, [func.toString(), params.Payload, { functionName: params.FunctionName }])
      .then(results => callback(null, toInvocationResponse(results)),
          err => callback(null, toFailedInvocationResponse(err)));
  }

  public hasAvailableWorker(): boolean {
    return true;
  }
}

// @ts-ignore
const toAWSError = (err: Error): Partial<AWSError> => {
  const stack = err.stack ? err.stack : '';
  const _stack = stack.split("\n");
  _stack.shift();
  for (let i =0; i < _stack.length; i++){_stack[i] = _stack[i].trim().substr(3);}
  return {
    code: err.name,
    message: err.message,
    name: err.name,
    requestId: '8a0dc938-dc4a-11e8-9c76-b1f10c1bb367',
    retryDelay: 50,
    retryable: false,
    stack: err.stack,
    statusCode: 404,
    time: new Date(),
  };
};

const generateResourceNotFoundException = (): AWSError => {
  const err = new Error('Function not found: arn:aws:lambda:us-east-1:000000000000:function:noExistFunction');
  err.name = 'ResourceNotFoundException';
  return toAWSError(err) as AWSError;
};

const toInvocationResponse = (data: any): InvocationResponse => {
  const res: InvocationResponse = {StatusCode: 200};
  if (data) {
    res.Payload = JSON.stringify(data);
  }
  return res;
};

const toFailedInvocationResponse = (err: Error): InvocationResponse => {
  const res: InvocationResponse = {FunctionError: 'Handled', StatusCode: 200};
  if (err) {
    res.Payload = JSON.stringify(toPayloadError(err));
  }
  return res;
};

interface IPayloadError {
  errorMessage: string;
  errorType: string;
  stackTrace: string[];
}

const toPayloadError = (err: Error): IPayloadError => {
  const stack = err.stack ? err.stack : '';
  const _stack = stack.split("\n");
  return {
    errorMessage: err.message,
    errorType: err.name,
    stackTrace: _stack,
  };
};
