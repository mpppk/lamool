import * as workerpool from 'workerpool';
it('can execute workerpool', async () => {
  const add = (a: number, b: number) => a + b;
  const pool = workerpool.pool();
  const result = await pool.exec(add, [2, 3]);
  expect(result).toBe(5);
});
