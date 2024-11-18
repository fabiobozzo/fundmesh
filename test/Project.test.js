const { setup, projectData } = require('./setup.js');
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

let accounts;
let projectFactory;
let project;
let projectNft;

beforeEach(async () => {
  const setupData = await setup(web3);
  accounts = setupData.accounts;
  projectFactory = setupData.projectFactory;
  project = setupData.project;
  projectNft = setupData.projectNft;
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
    assert.equal(summary[1], projectData.recipient);
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

  it('accepts valid contributions', async () => {
    const validAmount = projectData.minimumContribution + 1;
    
    await project.methods.contribute().send({
      from: accounts[2],
      value: validAmount.toString(),
      gas: '200000'
    });

    const contribution = await project.methods.getContribution(accounts[2]).call();
    assert(contribution > 0, 'Contribution should have been recorded');
  });

  it('rejects contributions that are over the target or lower than the minimum', async () => {
    let success = true;

    try {
      const belowMin = projectData.minimumContribution - 1;
      await project.methods.contribute().send({
        from: accounts[2],
        value: belowMin.toString(),
        gas: '200000'
      });
      success = false;
    } catch (err) {
      // error caught as expected for below minimum
    }

    assert(success);

    try {
      const aboveTarget = web3.utils.toBN(projectData.targetContribution).add(web3.utils.toBN('1'));
      await project.methods.contribute().send({
        from: accounts[2],
        value: aboveTarget.toString(),
        gas: '200000'
      });
      success = false;
    } catch (err) {
      // error caught as expected for above target 
    }

    assert(success);
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

  it('rejects approvals before the target contribution of the project is reached', async () => {
    let success = true;

    try {
      await project.methods.approve().send({ from: accounts[2], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('rejects approvals from users that are not contributors to the project', async () => {
    let success = true;

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 100).toString() });

    try {
      await project.methods.approve().send({ from: accounts[4], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('rejects double approvals', async () => {
    let success = true;

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 100).toString() });
    await project.methods.approve().send({ from: accounts[2], gas: '140000' });

    try {
      await project.methods.approve().send({ from: accounts[2], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows users to approve a project that reached its target contribution and a quorum of approvals', async () => {
    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[4], value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() });

    await project.methods.approve().send({ from: accounts[2], gas: '140000' });
    const statusBefore = await project.methods.status().call();
    assert.equal(false, statusBefore.approved);

    await project.methods.approve().send({ from: accounts[3], gas: '140000' });
    const statusAfter = await project.methods.status().call();
    assert.equal(true, statusAfter.approved);
    assert.equal(2, statusAfter.approvalsCount);
    assert(statusAfter.approvedAt > 0);

    const approval2 = await project.methods.getApproval(accounts[2]).call();
    const approval3 = await project.methods.getApproval(accounts[3]).call();
    const approval4 = await project.methods.getApproval(accounts[4]).call();

    assert(approval2 > 0);
    assert(approval3 > 0);
    assert(approval4 == 0);
  });

  it('rejects a reward if the project is not yet approved', async () => {
    let success = true;

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() });

    try {
      await project.methods.reward('').send({ from: accounts[2], gas: '1400000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('rejects a reward if the requestor was not a contributor to the project', async () => {
    let success = true;

    await project.methods.contribute().send({ 
      from: accounts[2], 
      value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() 
    });
    await project.methods.contribute().send({ 
      from: accounts[3], 
      value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() 
    });
    await project.methods.contribute().send({ 
      from: accounts[4], 
      value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() 
    });
    await project.methods.approve().send({ from: accounts[2], gas: '140000' });
    await project.methods.approve().send({ from: accounts[3], gas: '140000' });

    try {
      await project.methods.reward('').send({ from: accounts[5], gas: '1400000' });
      success = false;
    } catch (err) {
      // error caught as expected for non-contributor reward request
    }
    
    assert(success);
  });

  it('rejects double reward requests', async () => {
    let success = true;

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() });
    await project.methods.approve().send({ from: accounts[2], gas: '140000' });
    await project.methods.approve().send({ from: accounts[3], gas: '140000' });
    await project.methods.reward('').send({ from: accounts[2], gas: '1400000' });

    try {
      await project.methods.reward('').send({ from: accounts[2], gas: '1400000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows users to receive a reward for an approved project', async () => {
    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[4], value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() });
    await project.methods.approve().send({ from: accounts[2], gas: '140000' });
    await project.methods.approve().send({ from: accounts[3], gas: '140000' });

    const testTokenURI = 'ipfs://QmNpHFmk4GbJxDon2r2soYpwmrKaz1s6QfGMnBJtjA2ESd/1';
    await project.methods.reward(testTokenURI).send({ from: accounts[3], gas: '1400000' });

    const tokenURI = await projectNft.methods.tokenURI(0).call();
    assert.equal(testTokenURI, tokenURI);
    let balance = await projectNft.methods.balanceOf(accounts[3]).call();
    assert.equal(1, balance);
    balance = await projectNft.methods.balanceOf(accounts[2]).call();
    assert.equal(0, balance);
  });

  it('rejects a withdrawal if the project is not yet approved', async () => {
    let success = true;

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() });

    try {
      await project.methods.withdraw().send({ from: accounts[0], gas: '1400000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows the owner to withdraw money from an approved project', async () => {
    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() });
    await project.methods.contribute().send({ from: accounts[4], value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() });
    await project.methods.approve().send({ from: accounts[2], gas: '140000' });
    await project.methods.approve().send({ from: accounts[3], gas: '140000' });

    const initialRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    await project.methods.withdraw().send({ from: accounts[0], gas: '1400000' });

    const finalRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    assert(finalRecipientBalance - initialRecipientBalance >= projectData.targetContribution);

    const status = await project.methods.status().call();
    assert(status.completed);
    assert(status.completedAt > 0);
  });
});