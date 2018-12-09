const createFunction = (lambda, params) => {
  return new Promise((resolve, reject) => {
    lambda.createFunction(params, (err, data) => {
      if (err) { reject(err); }
      resolve(data);
    });
  });
};

const invoke = (lambda, invokeParams) => {
  return new Promise((resolve, reject) => {
      lambda.invoke(invokeParams, (err, data) => {
        if (err) { reject(err); return; }
        if (!data.Payload) { reject(new Error('payload is empty')); return; }
        resolve(data.Payload);
      })
    }
  );
};

module.exports = {
  createFunction,
  invoke,
};
