import axios from 'axios';
import { requireFromURL } from '../src';

jest.mock('axios');

describe('requireFromURL', () => {
  it('fetch function from given URL', async () => {
    const mockFuncStr ='exports.handler = (a) => {return a+a;};';
    (axios.get as any).mockResolvedValue({data: mockFuncStr});
    const exports = await requireFromURL('');
    expect(exports.handler(3)).toBe(6);
  });
});
