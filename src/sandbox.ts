import { Lamool, requireFromString } from './lamool';

interface IMessage {
  message: string;
}

const lamool = new Lamool();
lamool.createFunction('hello', (_event, _context, callback) => {
  callback(null, { message: 'hello world' });
});
lamool.invoke({ FunctionName: 'hello', Payload: {} }, (_, result: IMessage | null) => {
  console.log(result); // tslint:disable-line no-console
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
