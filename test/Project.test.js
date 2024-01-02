const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

const compiledProjectFactory = require('../build/ProjectFactory.json');
const compiledProject = require('../build/Project.json');
const { log } = require('console');

const testMinimumContribution = 100;
const testTargetContribution = 100000;
const threshold1 = 30000;
const threshold2 = 70000;
const threshold3 = 90000;
const testCid = 'bafyreicnokmhmrnlp2wjhyk2haep4tqxiptwfrp2rrs7rzq7uk766chqvq';

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
      accounts[1],
      testCid,
      testMinimumContribution.toString(),
      testTargetContribution.toString(),
      projectDeadline.toString(),
      'name-',
      'symbol-'
    )
    .send({ from: accounts[0], gas: '4000000' });

  [projectAddress] = await projectFactory.methods.getDeployedProjects().call();
  project = await new web3.eth.Contract(compiledProject.abi, projectAddress);
});

describe('Projects', () => {
  it('deploys the factory and creates one and only one project with the creator as project owner', async () => {
    assert.ok(projectFactory.options.address);
    assert.ok(project.options.address);

    const ownerAddress = await project.methods.owner().call();
    assert.equal(accounts[0], ownerAddress);
  });

  it('sets a pristine initial state for the deployed project', async () => {
    const summary = await project.methods.getSummary().call();

    assert.equal(summary[0], 0); // balance
    assert.equal(summary[1], accounts[1]); //recipient
    assert.equal(summary[2], testCid);
    assert.equal(summary[3], testMinimumContribution);
    assert.equal(summary[4], testTargetContribution);
    assert.equal(summary[5], projectDeadline);
    assert.equal(summary[6], 0); // contributors count
    assert.equal(summary[7], false); // approved 
    assert.equal(summary[8], 0); // approved timestamp 
    assert.equal(summary[9], 0); // approvals count
    assert.equal(summary[10], false); //completed
    assert.equal(summary[11], 0); // completed timestamp
  });

  it('validates users min/max contributions', async () => {
    let success = true;

    try {
      await project.methods.contribute().send({ from: accounts[2], value: (testMinimumContribution - 1).toString() });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await project.methods.contribute().send({ from: accounts[2], value: (testTargetContribution + 1).toString() });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows users to send money and marks them as contributors', async () => {
    // 1st contribution 
    await project.methods.contribute().send({ from: accounts[2], value: (testMinimumContribution + 100).toString() });

    const isContributor = await project.methods.contributors(accounts[2]).call();
    assert(isContributor);

    const isNotContributor = ! await project.methods.contributors(accounts[1]).call();
    assert(isNotContributor);

    let contributorsCount = 0;
    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 1);

    // 2nd contribution - balance increases while contributorsCount stays the same
    await project.methods.contribute().send({ from: accounts[2], value: (testMinimumContribution + 100).toString() });

    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 1);

    // 3rd contribution - other user
    await project.methods.contribute().send({ from: accounts[3], value: (testMinimumContribution + 100).toString() });

    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 2);

    const balance = await web3.eth.getBalance(project.options.address);
    assert.equal(balance, testMinimumContribution * 3 + 300);

    const summary = await project.methods.getSummary().call();
    assert.equal(summary[0], balance);
    assert.equal(summary[6], contributorsCount);
  });

  it('restrict milestones creation to the project owner', async () => {
    let success = true;

    try {
      await project.methods
        .createMilestone('Milestone1', threshold1, accounts[2])
        .send({ from: accounts[1], gas: '140000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('validates a project milestone attributes', async () => {
    let success = true;

    try {
      await project.methods
        .createMilestone('', threshold1.toString(), accounts[2])
        .send({ from: accounts[0], gas: '140000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await project.methods
        .createMilestone('Milestone1', '0', accounts[2])
        .send({ from: accounts[0], gas: '140000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await project.methods
        .createMilestone('Milestone1', threshold1.toString(), '')
        .send({ from: accounts[0], gas: '140000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('creates a single project milestone', async () => {
    await project.methods
      .createMilestone('Milestone1', threshold1.toString(), accounts[2])
      .send({ from: accounts[0], gas: '140000' });

    const milestonesCount = await project.methods.getMilestonesCount().call();
    assert.equal(milestonesCount, 1);

    const milestone = await project.methods.milestones(0).call();
    const status = await project.methods.milestoneStatuses(0).call();

    assert.equal(milestone.description, 'Milestone1');
    assert.equal(milestone.threshold, threshold1);
    assert.equal(milestone.recipient, accounts[2]);
    assert.equal(status.approved, false);
    assert.equal(status.completed, false);
  });

  it('validate multiple milestones input before creation', async () => {
    let success = true;

    try {
      await project.methods
        .createMilestones(
          ['M1', 'M2', 'M3'],
          [threshold3.toString(), threshold2.toString(), threshold1.toString()],
          [accounts[0], accounts[1], accounts[2]]
        )
        .send({ from: accounts[0], gas: '300000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await project.methods
        .createMilestones(
          ['M1', 'M2', 'M3'],
          [threshold1.toString()],
          [accounts[0], accounts[1]]
        )
        .send({ from: accounts[0], gas: '300000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('creates multiple milestones in one go', async () => {
    await project.methods
      .createMilestones(
        ['M1', 'M2', 'M3'],
        [threshold1.toString(), threshold2.toString(), threshold3.toString()],
        [accounts[0], accounts[1], accounts[2]]
      )
      .send({ from: accounts[0], gas: '300000' });

    const milestonesCount = await project.methods.getMilestonesCount().call();
    assert.equal(milestonesCount, 3);

    const milestone1 = await project.methods.milestones(0).call();
    const milestone2 = await project.methods.milestones(1).call();
    const milestone3 = await project.methods.milestones(2).call();

    assert.equal(milestone1.threshold, threshold1);
    assert.equal(milestone2.threshold, threshold2);
    assert.equal(milestone3.threshold, threshold3);
  });
});