const fileToIterable = (file) => {
  const reader = file.stream().getReader();
  return {
    [Symbol.asyncIterator]: async function* () {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          return;
        }
        yield new Uint8Array(value);
      }
    }
  };
};

export {
  fileToIterable
};