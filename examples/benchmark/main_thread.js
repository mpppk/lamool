const fib = require('./util').fib;

const TEST_CASES = [
  {fibNum: 38, loopNum: 1, tryNum: 3},
  {fibNum: 40, loopNum: 1, tryNum: 3},
  {fibNum: 38, loopNum: 5, tryNum: 3},
  {fibNum: 40, loopNum: 5, tryNum: 3},
  {fibNum: 38, loopNum: 30, tryNum: 3},
  {fibNum: 40, loopNum: 30, tryNum: 3},
];

const benchmark = (fibNum, loopNum, tryNum) => {
  for (let try_i = 0; try_i < tryNum; try_i++) {
    const testName = `${try_i}: main_thread FIB:${fibNum} LOOP:${loopNum}`;
    console.time(testName);
    for (let i = 0; i < loopNum; i++) { fib(fibNum); }
    console.timeEnd(testName);
  }
};

for (const c of TEST_CASES) {
  benchmark(c.fibNum, c.loopNum, c.tryNum);
}

