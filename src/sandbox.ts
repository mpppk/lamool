import { requireFromString } from './lamool';
import { LocalLambda } from './local_lambda';

const localLambda = new LocalLambda();
localLambda.createFunction('hello', (_event, _context, callback) => {
  callback(null, { message: 'hello world' });
});
localLambda.invoke({ FunctionName: 'hello', Payload: {} }, (_, result) => {
  if (!result.Payload) {
    console.error('payload does not exist'); // tslint:disable-line
  }
  console.log(JSON.parse(result.Payload as string)); // tslint:disable-line no-console
});

(async () => {
  const res = await fetch('https://gist.githubusercontent.com/mpppk/0b34b92f46f3db0537bd83fcba13ea7e/raw/7ddb5ff7d75493b72d98e00997384f6cbf98df6b/lambda-sum');
  if (!res.body) {
    console.error('response body is null', res); // tslint:disable-line
    return;
  }
  const exports = requireFromString(await res.text());
  console.log(exports.handler(3)/* => will be 6 */); // tslint:disable-line
})();

