const { GAS } = require('./constants');

const sendTransaction = async (method, options = {}) => {
  const defaultOptions = {
    gas: GAS.DEFAULT,
    ...options
  };
  
  return method.send(defaultOptions);
};

module.exports = { sendTransaction }; 