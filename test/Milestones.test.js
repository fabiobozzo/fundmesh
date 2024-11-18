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

describe('Milestones', () => {
  it('restrict milestones creation to the project owner', async () => {
    let success = true;

    try {
      await project.methods
        .createMilestone('Milestone1', projectData.threshold1, accounts[2])
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
        .createMilestone('', projectData.threshold1.toString(), accounts[2])
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
        .createMilestone('Milestone1', projectData.threshold1.toString(), '')
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
      .createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2])
      .send({ from: accounts[0], gas: '140000' });

    const milestonesCount = await project.methods.getMilestonesCount().call();
    assert.equal(milestonesCount, 1);

    const milestone = await project.methods.milestones(0).call();
    const status = await project.methods.milestoneStatuses(0).call();

    assert.equal(milestone.description, 'Milestone1');
    assert.equal(milestone.threshold, projectData.threshold1);
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
          [projectData.threshold3.toString(), projectData.threshold2.toString(), projectData.threshold1.toString()],
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
          [projectData.threshold1.toString()],
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
        [projectData.threshold1.toString(), projectData.threshold2.toString(), projectData.threshold3.toString()],
        [accounts[0], accounts[1], accounts[2]]
      )
      .send({ from: accounts[0], gas: '300000' });

    const milestonesCount = await project.methods.getMilestonesCount().call();
    assert.equal(milestonesCount, 3);

    const milestone1 = await project.methods.milestones(0).call();
    const milestone2 = await project.methods.milestones(1).call();
    const milestone3 = await project.methods.milestones(2).call();

    assert.equal(milestone1.threshold, projectData.threshold1);
    assert.equal(milestone2.threshold, projectData.threshold2);
    assert.equal(milestone3.threshold, projectData.threshold3);
  });

  it('rejects approvals of a project that has pending milestones', async () => {
    let success = true;

    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), accounts[1])
      .send({ from: accounts[0], gas: '140000' });

    await project.methods.contribute().send({ from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() });
    await project.methods.contribute().send({ from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 100).toString() });

    try {
      await project.methods.approve().send({ from: accounts[2], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('rejects approvals of a milestone whose threshold is not reached', async () => {
    let success = true;

    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2])
      .send({ from: accounts[0], gas: '140000' });

    await project.methods.contribute().send({ from: accounts[2], value: projectData.minimumContribution.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: projectData.minimumContribution.toString() });

    try {
      await project.methods.approveMilestone(0).send({ from: accounts[2], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('rejects double or non-contributor approvals of a milestone', async () => {
    let success = true;

    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2])
      .send({ from: accounts[0], gas: '140000' });

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await project.methods.contribute().send({ from: accounts[2], value: contribution1.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: contribution1.toString() });

    try {
      // non-contributor
      await project.methods.approveMilestone(0).send({ from: accounts[4], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    await project.methods.approveMilestone(0).send({ from: accounts[2], gas: '140000' });
    try {
      // double approval
      await project.methods.approveMilestone(0).send({ from: accounts[2], gas: '140000' });
      success = false
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  it('allows users to approve a milestone that reached its threshold and a quorum of approvals', async () => {
    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient)
      .send({ from: accounts[0], gas: '140000' });
    await project.methods
      .createMilestone('Milestone2', projectData.threshold2.toString(), projectData.recipient)
      .send({ from: accounts[0], gas: '140000' });
    await project.methods
      .createMilestone('Milestone3', projectData.threshold3.toString(), projectData.recipient)
      .send({ from: accounts[0], gas: '140000' });

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await project.methods.contribute().send({ from: accounts[2], value: contribution1.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: contribution1.toString() });
    await project.methods.approveMilestone(0).send({ from: accounts[2], gas: '140000' });
    await project.methods.approveMilestone(0).send({ from: accounts[3], gas: '140000' });
    const status1 = await project.methods.milestoneStatuses(0).call();
    assert(status1.approved);
    assert(status1.approvedAt > 0);

    let summary = await project.methods.getSummary().call();
    assert(summary[0] >= projectData.threshold1);

    const contribution2 = (Math.floor((projectData.threshold2 - projectData.threshold1) / 2) + 1);
    await project.methods.contribute().send({ from: accounts[2], value: contribution2.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: contribution2.toString() });
    await project.methods.approveMilestone(1).send({ from: accounts[2], gas: '140000' });
    await project.methods.approveMilestone(1).send({ from: accounts[3], gas: '140000' });

    const status2 = await project.methods.milestoneStatuses(1).call();
    assert(status2.approved);
    assert(status2.approvedAt > 0);

    summary = await project.methods.getSummary().call();
    assert(summary[0] >= projectData.threshold2);

    const status3 = await project.methods.milestoneStatuses(2).call();
    assert(!status3.approved);
    assert(status3.approvedAt == 0);
  });

  it('rejects a withdrawal if the milestone is not yet approved', async () => {
    let success = true;

    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient)
      .send({ from: accounts[0], gas: '140000' });

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await project.methods.contribute().send({ from: accounts[2], value: contribution1.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: contribution1.toString() });

    const status = await project.methods.milestoneStatuses(0).call();
    assert(!status.approved);

    try {
      await project.methods.withdrawMilestone(0).send({ from: accounts[0], gas: '1400000' });
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  
  it('allows the owner to withdraw money from an approved milestone', async () => {
    await project.methods
      .createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient)
      .send({ from: accounts[0], gas: '140000' });

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await project.methods.contribute().send({ from: accounts[2], value: contribution1.toString() });
    await project.methods.contribute().send({ from: accounts[3], value: contribution1.toString() });
    await project.methods.approveMilestone(0).send({ from: accounts[2], gas: '140000' });
    await project.methods.approveMilestone(0).send({ from: accounts[3], gas: '140000' });

    const initialRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    await project.methods.withdrawMilestone(0).send({ from: accounts[0], gas: '1400000' });

    const finalRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    assert(finalRecipientBalance - initialRecipientBalance >= projectData.threshold1);

    const status = await project.methods.milestoneStatuses(0).call();
    assert(status.completed);
    assert(status.completedAt > 0);
  });
});