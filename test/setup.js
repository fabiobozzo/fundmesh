const compiledProjectFactory = require('../build/ProjectFactory.json');
const compiledProject = require('../build/Project.json');
const compiledProjectNFT = require('../build/ProjectNFT.json');

const projectData = {
  minimumContribution: 100,
  targetContribution: 100000,
  threshold1: 30000,
  threshold2: 70000,
  threshold3: 90000,
  cid: 'bafyreicnokmhmrnlp2wjhyk2haep4tqxiptwfrp2rrs7rzq7uk766chqvq'
};

const setup = async (web3) => {
  accounts = await web3.eth.getAccounts();
  projectData.recipient = accounts[1];

  projectFactory = await new web3.eth.Contract(compiledProjectFactory.abi)
    .deploy({ data: compiledProjectFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: '4000000' });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  projectData.deadline = Math.floor(futureDate.getTime() / 1000);

  await projectFactory.methods
    .createProject(
      projectData.recipient,
      projectData.cid,
      projectData.minimumContribution.toString(),
      projectData.targetContribution.toString(),
      projectData.deadline.toString(),
      'name-',
      'symbol-'
    )
    .send({ from: accounts[0], gas: '4000000' });

  let projectAddress;
  [projectAddress] = await projectFactory.methods.getDeployedProjects().call();
  project = await new web3.eth.Contract(compiledProject.abi, projectAddress);

  projectNftAddress = await project.methods.nft().call();
  projectNft = await new web3.eth.Contract(compiledProjectNFT.abi, projectNftAddress);

  return { accounts, projectFactory, project, projectNft };
};

module.exports = { setup, projectData };