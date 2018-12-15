const { Lamool, funcToZip } = require('lamool');
const AWS = require('aws-sdk');
const Lambda = require('aws-sdk/clients/lambda');

AWS.config.region = 'us-east-1';
const lambda = new Lamool();
// const lambda = new Lambda({ apiVersion: '2015-03-31' });
/** ↑ Lamool has AWS Lambda compatible API
 * So you can replace AWS Lambda instance to Lamool (and vice versa) without any code changing */

// const lambda = new Lamool(new Lambda({ apiVersion: '2015-03-31' }));
/** ↑ You can pass AWS Lambda instance to Lamool constructor
 * to offload functions to AWS Lambda according to user defined strategy
 * */

(async () => {
  // This is a function according to AWS Lambda signature
  const lambdaFunction = (event, context, cb) => {
    cb(null, `key1: ${event.key1}`);
  };

  const FunctionName = 'MyFunction';
  const createFunctionParams = {
    Code: { ZipFile: await funcToZip(lambdaFunction) }, // Upload lambda function as zip
    FunctionName, // The name of the Lambda function
    Handler: 'index.handler', // The name of the method within your code that Lambda calls to execute your function
    // If you upload function via funcToZip, Handler must be 'index.handler'
    Role: 'arn:aws:iam::000000000000:role/SomeRole',
    Runtime: 'nodejs8.10', // The runtime version for the function
  };

  const invokeParams = {
    FunctionName, // The name of the Lambda function.
    Payload: JSON.stringify({ key1: 'v1' }) // JSON that you want to provide to your Lambda function as input
  };

  // Creates a new Lambda function
  lambda.createFunction(createFunctionParams, (err, data) => {
    if (err) { console.error(err); return; }
    console.log('function creating is succeed:', data);

    // Invokes a Lambda function
    lambda.invoke(invokeParams, (err, data) =>{
      if (err) { console.error(err); return; }
      if (!data.Payload) { console.error('payload is empty'); }

      // data.Payload is the JSON representation of the object returned by the Lambda function
      const payload = JSON.parse(data.Payload);

      // Indicates whether an error occurred while executing the Lambda function.
      // If an error occurred this field will have one of two values; Handled or Unhandled
      if (data.FunctionError) {
        console.error(`${data.FunctionError} error type:${payload.errorType} message:${payload.error}`);
      }
      console.log('result:', payload);

      // Lamool has terminate() that is not compatible with AWS Lambda
      // for terminate child processes or web workers
      if (lambda.terminate) {
        lambda.terminate();
      }
    });
  });
})();

