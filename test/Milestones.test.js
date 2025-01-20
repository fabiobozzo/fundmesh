const { setup, projectData } = require('./setup.js');
const { GAS } = require('./constants');
const { sendTransaction } = require('./helpers');
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

let accounts;
let projectFactory;
let project;
let projectNft;
let factoryOwner;

beforeEach(async () => {
  const setupData = await setup(web3);
  accounts = setupData.accounts;
  projectFactory = setupData.projectFactory;
  project = setupData.project;
  projectNft = setupData.projectNft;
  factoryOwner = setupData.factoryOwner;
});

describe('Milestones', () => {
  /* Operations:
   * 1. Attempt to create milestone as non-owner
   * Assertions:
   * - Transaction reverts
   */
  it('restrict milestones creation to the project owner', async () => {
    let success = true;

    try {
      await sendTransaction(
        project.methods.createMilestone('Milestone1', projectData.threshold1, accounts[2]),
        { from: accounts[1] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Try to create milestone with empty description
   * 2. Try to create milestone with zero threshold
   * 3. Try to create milestone with empty recipient
   * Assertions:
   * - All transactions revert
   */
  it('validates a project milestone attributes', async () => {
    let success = true;

    try {
      await sendTransaction(
        project.methods.createMilestone('', projectData.threshold1.toString(), accounts[2]),
        { from: accounts[0] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await sendTransaction(
        project.methods.createMilestone('Milestone1', '0', accounts[2]),
        { from: accounts[0] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await sendTransaction(
        project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), ''),
        { from: accounts[0] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create milestone with valid params
   * Assertions:
   * - Milestone count is 1
   * - Milestone properties match input
   * - Status is not approved/completed
   */
  it('creates a single project milestone', async () => {
    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2]),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

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

  /* Operations:
   * 1. Try to create milestones with descending thresholds
   * 2. Try to create milestones with mismatched array lengths
   * Assertions:
   * - Both transactions revert
   */
  it('validate multiple milestones input before creation', async () => {
    let success = true;

    try {
      await sendTransaction(
        project.methods.createMilestones(
          ['M1', 'M2', 'M3'],
          [projectData.threshold3.toString(), projectData.threshold2.toString(), projectData.threshold1.toString()],
          [accounts[0], accounts[1], accounts[2]]
        ),
        { from: accounts[0], gas: GAS.MILESTONE }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    try {
      await sendTransaction(
        project.methods.createMilestones(
          ['M1', 'M2', 'M3'],
          [projectData.threshold1.toString()],
          [accounts[0], accounts[1]]
        ),
        { from: accounts[0], gas: GAS.MILESTONE }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create 3 milestones in single transaction
   * Assertions:
   * - Milestone count is 3
   * - Each milestone has correct threshold
   */
  it('creates multiple milestones in one go', async () => {
    await sendTransaction(
      project.methods.createMilestones(
        ['M1', 'M2', 'M3'],
        [projectData.threshold1.toString(), projectData.threshold2.toString(), projectData.threshold3.toString()],
        [accounts[0], accounts[1], accounts[2]]
      ),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    const milestonesCount = await project.methods.getMilestonesCount().call();
    assert.equal(milestonesCount, 3);

    const milestone1 = await project.methods.milestones(0).call();
    const milestone2 = await project.methods.milestones(1).call();
    const milestone3 = await project.methods.milestones(2).call();

    assert.equal(milestone1.threshold, projectData.threshold1);
    assert.equal(milestone2.threshold, projectData.threshold2);
    assert.equal(milestone3.threshold, projectData.threshold3);
  });

  /* Operations:
   * 1. Create milestone
   * 2. Fund project to target
   * 3. Try to approve project
   * Assertions:
   * - Approval reverts due to pending milestone
   */
  it('rejects approvals of a project that has pending milestones', async () => {
    let success = true;

    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), accounts[1]),
      { from: accounts[0] }
    );

    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 100).toString() }
    );

    try {
      await sendTransaction(
        project.methods.approve(),
        { from: accounts[2] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create milestone
   * 2. Make small contributions
   * 3. Try to approve milestone
   * Assertions:
   * - Approval reverts due to insufficient funds
   */
  it('rejects approvals of a milestone whose threshold is not reached', async () => {
    let success = true;

    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2]),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: projectData.minimumContribution.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: projectData.minimumContribution.toString() }
    );

    try {
      await sendTransaction(
        project.methods.approveMilestone(0),
        { from: accounts[2] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create milestone
   * 2. Fund to threshold
   * 3. Try approval from non-contributor
   * 4. Try double approval from contributor
   * Assertions:
   * - Both approval attempts revert
   */
  it('rejects double or non-contributor approvals of a milestone', async () => {
    let success = true;

    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2]),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution1.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution1.toString() }
    );

    try {
      await sendTransaction(
        project.methods.approveMilestone(0),
        { from: accounts[4] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }

    await sendTransaction(
      project.methods.approveMilestone(0),
      { from: accounts[2] }
    );

    try {
      await sendTransaction(
        project.methods.approveMilestone(0),
        { from: accounts[2] }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create 3 milestones
   * 2. For each milestone:
   *    - Fund to threshold
   *    - Get approvals
   *    - Withdraw (except last)
   * Assertions:
   * - Each milestone gets approved
   * - First two get completed
   */
  it('allows users to approve a milestone that reached its threshold and a quorum of approvals', async () => {
    // Create 3 milestones with thresholds at 30%, 70%, and 90% of target
    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient),
      { from: accounts[0], gas: GAS.MILESTONE }
    );
    await sendTransaction(
      project.methods.createMilestone('Milestone2', projectData.threshold2.toString(), projectData.recipient),
      { from: accounts[0], gas: GAS.MILESTONE }
    );
    await sendTransaction(
      project.methods.createMilestone('Milestone3', projectData.threshold3.toString(), projectData.recipient),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    // First milestone - need threshold1 (30%)
    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution1.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution1.toString() }
    );

    await sendTransaction(
      project.methods.approveMilestone(0),
      { from: accounts[2] }
    );
    await sendTransaction(
      project.methods.approveMilestone(0),
      { from: accounts[3] }
    );
    await sendTransaction(
      project.methods.withdrawMilestone(0),
      { from: accounts[0], gas: GAS.WITHDRAW }
    );

    const status1 = await project.methods.milestoneStatuses(0).call();
    assert(status1.approved);
    assert(status1.completed);

    // Second milestone - need (threshold2 - threshold1)
    const contribution2 = (Math.floor((projectData.threshold2 - projectData.threshold1) / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution2.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution2.toString() }
    );

    await sendTransaction(
      project.methods.approveMilestone(1),
      { from: accounts[2] }
    );
    await sendTransaction(
      project.methods.approveMilestone(1),
      { from: accounts[3] }
    );
    await sendTransaction(
      project.methods.withdrawMilestone(1),
      { from: accounts[0], gas: GAS.WITHDRAW }
    );

    const status2 = await project.methods.milestoneStatuses(1).call();
    assert(status2.approved);
    assert(status2.completed);

    // Third milestone - need (threshold3 - threshold2)
    const contribution3 = (Math.floor((projectData.threshold3 - projectData.threshold2) / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution3.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution3.toString() }
    );

    await sendTransaction(
      project.methods.approveMilestone(2),
      { from: accounts[2] }
    );
    await sendTransaction(
      project.methods.approveMilestone(2),
      { from: accounts[3] }
    );

    const status3 = await project.methods.milestoneStatuses(2).call();
    assert(status3.approved);
    assert(!status3.completed);
  });

  /* Operations:
   * 1. Create milestone
   * 2. Fund to threshold
   * 3. Try to withdraw without approval
   * Assertions:
   * - Withdrawal reverts
   */
  it('rejects a withdrawal if the milestone is not yet approved', async () => {
    let success = true;

    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution1.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution1.toString() }
    );

    const status = await project.methods.milestoneStatuses(0).call();
    assert(!status.approved);

    try {
      await sendTransaction(
        project.methods.withdrawMilestone(0),
        { from: accounts[0], gas: GAS.WITHDRAW }
      );
      success = false;
    } catch (err) {
      assert(err);
    } finally {
      assert(success);
    }
  });

  /* Operations:
   * 1. Create milestone
   * 2. Fund to threshold
   * 3. Get approvals
   * 4. Withdraw funds
   * Assertions:
   * - Recipient balance increased
   * - Milestone marked completed
   */
  it('allows the owner to withdraw money from an approved milestone', async () => {
    await sendTransaction(
      project.methods.createMilestone('Milestone1', projectData.threshold1.toString(), projectData.recipient),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    const contribution1 = (Math.floor(projectData.threshold1 / 2) + 1);
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[2], value: contribution1.toString() }
    );
    await sendTransaction(
      project.methods.contribute(),
      { from: accounts[3], value: contribution1.toString() }
    );
    await sendTransaction(
      project.methods.approveMilestone(0),
      { from: accounts[2] }
    );
    await sendTransaction(
      project.methods.approveMilestone(0),
      { from: accounts[3] }
    );

    const initialRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    await sendTransaction(
      project.methods.withdrawMilestone(0),
      { from: accounts[0], gas: GAS.WITHDRAW }
    );

    const finalRecipientBalance = await web3.eth.getBalance(projectData.recipient);

    assert(finalRecipientBalance - initialRecipientBalance >= projectData.threshold1);

    const status = await project.methods.milestoneStatuses(0).call();
    assert(status.completed);
    assert(status.completedAt > 0);
  });

  /* Operations:
   * 1. Create milestone
   * 2. Make contribution
   * 3. Expire project
   * 4. Try to approve milestone
   * Assertions:
   * - Milestone approval reverts
   */
  it('prevents milestone operations on expired projects', async () => {
    const setupData = await setup(web3);
    const expireProject = setupData.project;
    const factoryOwner = setupData.factoryOwner;

    await sendTransaction(
      expireProject.methods.createMilestone('Milestone1', projectData.threshold1.toString(), accounts[2]),
      { from: accounts[0], gas: GAS.MILESTONE }
    );

    await sendTransaction(
      expireProject.methods.contribute(),
      { 
        from: accounts[2], 
        value: projectData.minimumContribution.toString()
      }
    );

    // Move time forward past deadline
    await web3.currentProvider.request({
      method: 'evm_increaseTime',
      params: [7 * 24 * 60 * 60 + 1]
    });
    await web3.currentProvider.request({ method: 'evm_mine' });

    await sendTransaction(
      expireProject.methods.expire(),
      { from: factoryOwner, gas: GAS.EXPIRE }
    );

    try {
      await sendTransaction(
        expireProject.methods.approveMilestone(0),
        { from: accounts[2], gas: GAS.MILESTONE }
      );
      assert(false, 'Should not allow milestone approval on expired project');
    } catch (err) {
      assert(err);
    }
  });
});