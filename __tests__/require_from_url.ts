import axios from 'axios';
import { LambdaFunction, requireFromURL } from '../src';

jest.mock('axios');

describe('requireFromURL', () => {
  it('can fetch module from URL', async () => {
    const originalData = { num: 1 };
    const expectedResult = { num: 2 };
    const incrementLambdaFunc: LambdaFunction<typeof originalData> = (e, _c, cb) => cb(null, { num: e.num + 1 });
    const incrementLambdaFuncStr = 'module.exports=' + incrementLambdaFunc.toString();

    (axios.get as any).mockImplementation((_: string) => ({ data: incrementLambdaFuncStr }));
    const newIncrementLambdaFunc = await requireFromURL('https://example.com');
    // tslint:disable-next-line no-empty
    const callback = jest.fn((_e: Error, _d: any) => {});
    newIncrementLambdaFunc(originalData, null, callback);
    expect(callback).toBeCalled();
    expect(callback).toBeCalledWith(null, expectedResult);
  });
});
