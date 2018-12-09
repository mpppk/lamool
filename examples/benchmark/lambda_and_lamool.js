const Lamool = require('lamool');
const AWS = require('aws-sdk');
const Lambda = require('aws-sdk/clients/lambda');
const invoke = require('./util').invoke;
const createFunction = require('./util').createFunction;

AWS.config.region = 'ap-northeast-1';
// AWS.config.region = 'us-east-1';
let lambda = new Lambda({ apiVersion: '2015-03-31' });
lambda = new Lamool.Lamool({lambda: lambda}); // lamool has AWS Lambda compatible API, so you can replace lambda instance to lamool
// let lambda = new Lamool.Lamool(); // lamool has AWS Lambda compatible API, so you can replace lambda instance to lamool

const TEST_CASES = [
  {fibNum: 38, loopNum: 1, tryNum: 3},
  {fibNum: 40, loopNum: 1, tryNum: 3},
  {fibNum: 38, loopNum: 5, tryNum: 3},
  {fibNum: 40, loopNum: 5, tryNum: 3},
  {fibNum: 38, loopNum: 30, tryNum: 3},
  {fibNum: 40, loopNum: 30, tryNum: 3},
];

const FunctionName = 'LamoolBenchmark';

const benchmark = async (lambda, fibNum, loopNum, tryID) => {
  const funcToZipTimeName = `${tryID}: funcToZip`;
  console.time(funcToZipTimeName);
  const funcZip = await Lamool.funcToZip((event, context, cb) => {
    const fib = (n) => n <= 1 ? n : fib(n-1)+fib(n-2);
    cb(null, fib(event.num));
  });
  console.timeEnd(funcToZipTimeName);

  const createFunctionParams = {
    Code: { ZipFile: funcZip },
    FunctionName,
    Handler: 'index.handler',
    MemorySize: 2048,
    Timeout: 15,
    Role: 'arn:aws:iam::000000000000:role/SomeRole',
    Runtime: 'nodejs8.10',
  };

  const createFunctionTimeName = tryID + ': createFunction';
  console.time(createFunctionTimeName);
  try {
    await createFunction(lambda, createFunctionParams);
  } catch (e) { }
  console.timeEnd(createFunctionTimeName);

  const invokeParams = { FunctionName, Payload: JSON.stringify({ num: fibNum }) };

  const invokeTimeName = `${tryID}: invoke FIB:${fibNum} LOOP:${loopNum}`;

  try {
    const invokePromises = [];
    console.time(invokeTimeName);
    for (let i = 0; i < loopNum; i++) {
      invokePromises.push(invoke(lambda, invokeParams));
    }
    const results = await Promise.all(invokePromises);
    console.timeEnd(invokeTimeName);
    return results;
  } catch (e) { console.error(e); }
};

const deleteFunction = async (lambda, FunctionName) => {
  const params = {
    FunctionName,
    Qualifier: "1"
  };
  return new Promise((resolve, reject) => {
    lambda.deleteFunction(params, (err, data) => {
      if (err) reject(err);
      else     resolve(data);
    });
  });
};

(async () => {
  for (const c of TEST_CASES) {
    for (let i = 0; i < c.tryNum; i++) {
      try {
        await benchmark(lambda, c.fibNum, c.loopNum, i);
      } catch (e) {
        console.error('unexpected error occurred');
      }
      try {
        if (lambda.deleteFunction) {
          await deleteFunction(lambda, FunctionName); // FIXME
        }
      } catch (e) {}
    }
  }
})();
