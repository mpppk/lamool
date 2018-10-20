import { Lamool } from './lamool';

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
