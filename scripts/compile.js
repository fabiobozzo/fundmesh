const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const listSolidityFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      fileList = listSolidityFiles(path.join(dir, file), fileList);
    } else if (path.extname(file) === '.sol') {
      fileList.push(path.join(dir, file));
    }
  });

  return fileList;
};

const buildPath = path.resolve(process.cwd(), 'build');
fs.removeSync(buildPath);

let sources = {}

// Add FundMesh contracts to the input sources
const contractsPath = path.resolve(process.cwd(), 'contracts');
const contractFiles = fs.readdirSync(contractsPath);
for (let file of contractFiles) {
  const sourcePath = path.resolve(contractsPath, file);
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');
  sources[file] = {
    content: sourceContent
  };
}

// Add OpenZeppelin contracts to the input sources
const openZeppelinPath = path.resolve(process.cwd(), 'node_modules', '@openzeppelin', 'contracts');
const openZeppelinFiles = listSolidityFiles(openZeppelinPath);
for (let file of openZeppelinFiles) {
  const source = fs.readFileSync(file, 'utf8');
  sources[file.replace(path.resolve(process.cwd(), 'node_modules') + path.sep, '')] = {
    content: source
  };
}

const input = JSON.stringify({
  language: "Solidity",
  sources: sources,
  settings: {
    optimizer: {
      enabled: true,
      runs: 1
    },
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
});

console.log('Building contracts...')

for (let file of contractFiles) {
  const contractJson = solc.compile(input);
  // console.log(contractJson);
  const output = JSON.parse(contractJson).contracts[file];

  fs.ensureDirSync(buildPath);

  for (let contract in output) {
    fs.outputJSONSync(
      path.resolve(buildPath, contract.replace(':', '') + '.json'),
      output[contract]
    );

    console.log('✅ Contract built and stored: ', contract);
  }
}
