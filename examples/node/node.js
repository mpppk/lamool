const Lamool = require('lamool');
const AWS = require('aws-sdk');
const Lambda = require('aws-sdk/clients/lambda');

AWS.config.region = 'us-east-1';
let lambda = new Lambda({ apiVersion: '2015-03-31' });
lambda = new Lamool.Lamool({lambda: lambda}); // lamool has AWS Lambda compatible API, so you can replace lambda instance to lamool
// lambda = new Lamool.Lamool({lambda: lambda}); // If you does not pass lambda instance, lamool will execute lambda function only on browser

(async () => {
  const funcZip = await Lamool.funcToZip((event, context, cb) => {
    cb(null, `key1: ${event.key1}`);
  });

  const FunctionName = 'MyFunction';
  const createFunctionParams = {
    Code: { ZipFile: funcZip },
    FunctionName,
    Handler: 'index.handler',
    Role: 'arn:aws:iam::000000000000:role/SomeRole',
    Runtime: 'nodejs8.10',
  };

  const createFunction = () => {
    return new Promise((resolve, reject) => {
      lambda.createFunction(createFunctionParams, (err, data) => {
        if (err) { reject(err); }
        resolve(data);
      });
    });
  };

  try {
    console.log('function creating is succeed:', await createFunction());
  } catch (e) { console.error(e); }

  const invokeParams = { FunctionName, Payload: JSON.stringify({ key1: 'v1' }) };
  const invoke = () => {
    return new Promise((resolve, reject) => {
      lambda.invoke(invokeParams, (err, data) => {
          if (err) { reject(err); }
          if (!data.Payload) { reject(new Error('payload is empty')); }
          resolve(data.Payload);
        })
      }
    );
  };

  try {
    console.log(await invoke());
  } catch (e) { console.error(e); }
})();
