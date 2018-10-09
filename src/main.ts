import {Lamool} from './lamool';
const lamool = new Lamool();
lamool.createFunction('hello',
  (_event, _context, callback) => {callback(null, {message: 'hello world'})});
lamool.invoke({FunctionName: 'hello', Payload: {}},
  (_, result) => console.log(result)); // tslint:disable-line
