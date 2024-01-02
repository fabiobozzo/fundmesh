const { setup, projectData } = require('./setup.js');
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

beforeEach(async () => {
  let accounts;
  let projectFactory;
  let project;
  await setup(web3);
});

describe('Project', () => {
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
    assert.equal(summary[2], projectData.cid);
    assert.equal(summary[3], projectData.minimumContribution);
    assert.equal(summary[4], projectData.targetContribution);
    assert.equal(summary[5], projectData.deadline);
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
      await project.methods.contribute().send({ from: accounts[2], value: (projectData.minimumContribution - 1).toString() });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await project.methods.contribute().send({ from: accounts[2], value: (projectData.targetContribution + 1).toString() });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows users to send money and marks them as contributors', async () => {
    // 1st contribution 
    await project.methods.contribute().send({ from: accounts[2], value: (projectData.minimumContribution + 100).toString() });

    const isContributor = await project.methods.contributors(accounts[2]).call();
    assert(isContributor);

    const isNotContributor = ! await project.methods.contributors(accounts[1]).call();
    assert(isNotContributor);

    let contributorsCount = 0;
    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 1);

    // 2nd contribution - balance increases while contributorsCount stays the same
    await project.methods.contribute().send({ from: accounts[2], value: (projectData.minimumContribution + 100).toString() });

    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 1);

    // 3rd contribution - other user
    await project.methods.contribute().send({ from: accounts[3], value: (projectData.minimumContribution + 100).toString() });

    contributorsCount = await project.methods.contributorsCount().call();
    assert.equal(contributorsCount, 2);

    const balance = await web3.eth.getBalance(project.options.address);
    assert.equal(balance, projectData.minimumContribution * 3 + 300);

    const summary = await project.methods.getSummary().call();
    assert.equal(summary[0], balance);
    assert.equal(summary[6], contributorsCount);
  });
});