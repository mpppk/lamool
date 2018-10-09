import { Lamool } from '../src/lamool';

interface IMessage {
  message: string
}

it('execute lamool', () => {
  const lamool = new Lamool();
  const message = 'hello world';
  lamool.createFunction('hello',
    (_event, _context, callback) => {callback(null, {message})});
  lamool.invoke({FunctionName: 'hello', Payload: {}},
    (_, result: IMessage) => {
      expect(result.message).toBe((message));
  });
});
