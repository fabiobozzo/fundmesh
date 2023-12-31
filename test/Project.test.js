const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

const compiledProjectFactory = require('../build/ProjectFactory.json');
const compiledProject = require('../build/Project.json');

let accounts;
let projectFactory;
let projectAddress;
let project;
let projectDeadline;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  projectFactory = await new web3.eth.Contract(compiledProjectFactory.abi)
    .deploy({ data: compiledProjectFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: '4000000' });

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  projectDeadline = Math.floor(futureDate.getTime() / 1000);

  await projectFactory.methods
    .createProject(
      accounts[0],
      'bafyreicnokmhmrnlp2wjhyk2haep4tqxiptwfrp2rrs7rzq7uk766chqvq',
      '100',
      '100000',
      projectDeadline.toString(),
      'project-is-completed',
      'FundMesh Project #',
      'FMP'
    )
    .send({ from: accounts[0], gas: '4000000' });

  [projectAddress] = await projectFactory.methods.getDeployedProjects().call();
  project = await new web3.eth.Contract(compiledProject.abi, projectAddress);
});

describe('Projects', () => {
  it('deploys the factory and one project', () => {
    assert.ok(projectFactory.options.address);
    assert.ok(project.options.address);
  });
});