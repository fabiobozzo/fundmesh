const isPosInt = (n) => {
  return n >>> 0 === parseFloat(n);
};

const isPosNum = (s) => {
  return s !== '' && !isNaN(s) && Number(s) >= 0;
}

export {
  isPosInt,
  isPosNum
}