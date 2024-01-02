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
});