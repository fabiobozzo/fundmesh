const compiledProject = require('../../build/Project.json');
const compiledProjectFactory = require('../../build/ProjectFactory.json');
const compiledProjectNFT = require('../../build/ProjectNFT.json');

const Factory = (web3) => {
  return new web3.eth.Contract(
    compiledProjectFactory.abi,
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS
  );
};

const Project = (web3, address) => {
  return new web3.eth.Contract(
    compiledProject.abi,
    address
  );
};

const ProjectNFT = (web3, address) => {
  return new web3.eth.Contract(
    compiledProjectNFT.abi,
    address
  );
};

export {
  Factory,
  Project,
  ProjectNFT
};