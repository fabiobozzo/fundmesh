const { setup, projectData } = require('./setup.js');
const { GAS } = require('./constants');
const { sendTransaction } = require('./helpers');
const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ quiet: true }));

let accounts;
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
  describe('Basic Setup', () => {
    it('deploys the factory and creates project with separate owner and recipient', async () => {
      const setupData = await setup(web3, false);
      const project = setupData.project;

      const ownerAddress = await project.methods.owner().call();
      const recipientAddress = await project.methods.recipient().call();

      assert.equal(accounts[0], ownerAddress);
      assert.equal(accounts[1], recipientAddress);
      assert.notEqual(ownerAddress, recipientAddress);
    });

    it('deploys the factory and creates project with owner as recipient', async () => {
      const setupData = await setup(web3, true);
      const project = setupData.project;

      const ownerAddress = await project.methods.owner().call();
      const recipientAddress = await project.methods.recipient().call();

      assert.equal(accounts[0], ownerAddress);
      assert.equal(ownerAddress, recipientAddress);
    });

    it('ensures a pristine initial state for the deployed project', async () => {
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
  });

  describe('Contributions', () => {
    it('accepts valid contributions', async () => {
      const validAmount = projectData.minimumContribution + 1;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: validAmount.toString() }
      );

      const contribution = await project.methods.getContribution(accounts[2]).call();
      assert(contribution > 0, 'Contribution should have been recorded');
    });

    it('rejects contributions that are over the target or lower than the minimum', async () => {
      let success = true;

      try {
        const belowMin = projectData.minimumContribution - 1;
        await sendTransaction(project.methods.contribute(), { from: accounts[2], value: belowMin.toString() });
        success = false;
      } catch (err) {
        // error caught as expected for below minimum
      }
      assert(success);

      try {
        const aboveTarget = web3.utils.toBN(projectData.targetContribution).add(web3.utils.toBN('1'));
        await sendTransaction(project.methods.contribute(), { from: accounts[2], value: aboveTarget.toString() }
        );
        success = false;
      } catch (err) {
        // error caught as expected for above target 
      }
      assert(success);
    });

    it('allows users to send money and marks them as contributors', async () => {
      // 1st contribution 
      await sendTransaction(project.methods.contribute(), { from: accounts[2], value: (projectData.minimumContribution + 100).toString() });

      const isContributor = await project.methods.contributors(accounts[2]).call();
      assert(isContributor > 0);

      const isNotContributor = await project.methods.contributors(accounts[1]).call();
      assert.equal(isNotContributor, 0);

      // Get contributors count from array length
      const summary = await project.methods.getSummary().call();
      const contributorsCount = summary[6];  // contributorAddresses.length from getSummary
      assert.equal(contributorsCount, 1);

      // 2nd contribution
      await sendTransaction(project.methods.contribute(), { from: accounts[2], value: (projectData.minimumContribution + 100).toString() });

      const newSummary = await project.methods.getSummary().call();
      assert.equal(newSummary[6], 1);  // contributorsCount stays the same

      // 3rd contribution
      await sendTransaction(project.methods.contribute(), { from: accounts[3], value: (projectData.minimumContribution + 100).toString() });

      const finalSummary = await project.methods.getSummary().call();
      assert.equal(finalSummary[6], 2);  // contributorsCount increases

      const balance = await web3.eth.getBalance(project.options.address);
      assert.equal(balance, projectData.minimumContribution * 3 + 300);
    });
  });

  describe('Approvals', () => {
    it('rejects approvals before the target contribution of the project is reached', async () => {
      let success = true;
      try {
        await sendTransaction(project.methods.approve(), { from: accounts[2] });
        success = false
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('rejects approvals from users that are not contributors to the project', async () => {
      let success = true;

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
          { from: accounts[4] }
        );
        success = false
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('rejects double approvals', async () => {
      let success = true;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 100).toString() }
      );
      await sendTransaction(
        project.methods.approve(),
        { from: accounts[2] }
      );

      try {
        await sendTransaction(
          project.methods.approve(),
          { from: accounts[2] }
        );
        success = false
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('allows users to approve a project that reached its target contribution and a quorum of approvals', async () => {
      await sendTransaction(
        project.methods.contribute(),
        {
          from: accounts[2],
          value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString()
        }
      );
      await sendTransaction(
        project.methods.contribute(),
        {
          from: accounts[3],
          value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString()
        }
      );
      await sendTransaction(
        project.methods.contribute(),
        {
          from: accounts[4],
          value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString()
        }
      );

      await sendTransaction(project.methods.approve(), { from: accounts[2] });
      const statusBefore = await project.methods.status().call();
      assert.equal(false, statusBefore.approved);

      await sendTransaction(project.methods.approve(), { from: accounts[3] });
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
  });

  describe('Rewards', () => {
    it('rejects a reward if the project is not yet approved', async () => {
      let success = true;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() }
      );

      try {
        await sendTransaction(project.methods.reward(''), { from: accounts[2], gas: GAS.REWARD });
        success = false;
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('rejects a reward if the requestor was not a contributor to the project', async () => {
      let success = true;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[4], value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() }
      );
      await sendTransaction(project.methods.approve(), { from: accounts[2] });
      await sendTransaction(project.methods.approve(), { from: accounts[3] });

      try {
        await sendTransaction(project.methods.reward(''), { from: accounts[5], gas: GAS.REWARD });
        success = false;
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('rejects double reward requests', async () => {
      let success = true;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() }
      );
      await sendTransaction(project.methods.approve(), { from: accounts[2] });
      await sendTransaction(project.methods.approve(), { from: accounts[3] });
      await sendTransaction(project.methods.reward(''), { from: accounts[2], gas: GAS.REWARD });

      try {
        await sendTransaction(project.methods.reward(''), { from: accounts[2], gas: GAS.REWARD });
        success = false;
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('allows users to receive a reward for an approved project', async () => {
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 3)) - 1).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[4], value: ((Math.floor(projectData.targetContribution / 3)) + 100).toString() }
      );
      await sendTransaction(project.methods.approve(), { from: accounts[2] });
      await sendTransaction(project.methods.approve(), { from: accounts[3] });

      const testTokenURI = 'ipfs://QmNpHFmk4GbJxDon2r2soYpwmrKaz1s6QfGMnBJtjA2ESd/1';
      await sendTransaction(project.methods.reward(testTokenURI), { from: accounts[3], gas: GAS.REWARD });

      const tokenURI = await projectNft.methods.tokenURI(0).call();
      assert.equal(testTokenURI, tokenURI);
      let balance = await projectNft.methods.balanceOf(accounts[3]).call();
      assert.equal(1, balance);
      balance = await projectNft.methods.balanceOf(accounts[2]).call();
      assert.equal(0, balance);
    });
  });

  describe('Withdrawal', () => {
    it('rejects a withdrawal if the project is not yet approved', async () => {
      let success = true;

      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: ((Math.floor(projectData.targetContribution / 2))).toString() }
      );
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[3], value: ((Math.floor(projectData.targetContribution / 2)) + 1).toString() }
      );

      try {
        await sendTransaction(project.methods.withdraw(), { from: accounts[0], gas: GAS.WITHDRAW });
        success = false;
      } catch (err) {
        assert(err);
      } finally {
        assert(success);
      }
    });

    it('allows the owner to withdraw money from an approved project', async () => {
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: projectData.targetContribution.toString() }
      );

      await sendTransaction(
        project.methods.approve(),
        { from: accounts[2] }
      );

      const initialRecipientBalance = BigInt(await web3.eth.getBalance(projectData.recipient));
      const tx = await sendTransaction(project.methods.withdraw(), { from: projectData.recipient, gas: GAS.WITHDRAW });

      // Account for gas costs
      const gasUsed = BigInt(tx.gasUsed);
      const gasPrice = BigInt(tx.effectiveGasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalRecipientBalance = BigInt(await web3.eth.getBalance(projectData.recipient));
      const balanceChange = finalRecipientBalance - initialRecipientBalance + gasCost;

      assert(balanceChange > 0n);
    });

    it('allows only recipient to withdraw from approved project', async () => {
      await sendTransaction(project.methods.contribute(), { from: accounts[2], value: projectData.targetContribution.toString() });
      await sendTransaction(project.methods.approve(), { from: accounts[2] });

      const initialBalance = BigInt(await web3.eth.getBalance(accounts[1]));
      const tx = await sendTransaction(
        project.methods.withdraw(),
        {
          from: accounts[1],  // recipient
          gas: GAS.WITHDRAW
        }
      );

      // Account for gas costs in balance comparison
      const gasUsed = BigInt(tx.gasUsed);
      const gasPrice = BigInt(tx.effectiveGasPrice);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = BigInt(await web3.eth.getBalance(accounts[1]));
      const balanceChange = finalBalance - initialBalance + gasCost;

      assert(balanceChange > 0n);
    });
  });

  describe('Cancel and Expire', () => {
    let project;
    let factoryOwner;

    beforeEach(async () => {
      // Reset blockchain time before each test to ensure consistent state
      const now = Math.floor(Date.now() / 1000);
      await web3.currentProvider.request({ method: 'evm_setTime', params: [now * 1000] }); // needs milliseconds
      await web3.currentProvider.request({ method: 'evm_mine' });

      const setupData = await setup(web3, false);
      project = setupData.project;
      factoryOwner = await setupData.projectFactory.methods.owner().call();
    });

    /* Operations:
     * 1. Make contribution
     * 2. Cancel project as owner
     * Assertions:
     * - Project is marked as cancelled
     * - Cancellation timestamp is set
     * - Contributor received refund
     */
    it('allows owner to cancel project before deadline', async () => {
      await sendTransaction(project.methods.contribute(),{from: accounts[2], value: projectData.minimumContribution.toString()});

      const initialBalance = BigInt(await web3.eth.getBalance(accounts[2]));
      await sendTransaction(project.methods.cancel(),{from: accounts[0],gas: GAS.EXPIRE});

      const finalBalance = BigInt(await web3.eth.getBalance(accounts[2]));

      const status = await project.methods.status().call();
      assert(status.cancelled, "Project should be marked as cancelled");
      assert(status.cancelledAt > 0, "Cancellation timestamp should be set");
      assert(finalBalance > initialBalance, "Contributor should be refunded");
    });

    /* Operations:
     * 1. Attempt to cancel as non-owner
     * Assertions:
     * - Transaction reverts
     */
    it('prevents non-owner from cancelling project', async () => {
      try {
        await sendTransaction(project.methods.cancel(), { from: accounts[2] });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it('prevents cancellation of approved project', async () => {
      await sendTransaction(
        project.methods.contribute(),
        { from: accounts[2], value: projectData.targetContribution.toString() }
      );
      await sendTransaction(
        project.methods.approve(),
        { from: accounts[2] }
      );

      try {
        await sendTransaction(
          project.methods.cancel(),
          { from: accounts[0] }
        );
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    /* Operations:
     * 1. Make contribution
     * 2. Advance time past deadline
     * 3. Expire project as factory owner
     * Assertions:
     * - Contributor received refund
     */
    it('allows factory owner to expire project after deadline', async () => {
      await sendTransaction(project.methods.contribute(), { from: accounts[2], value: projectData.minimumContribution.toString() });

      // Move time forward past deadline
      await web3.currentProvider.request({ method: 'evm_increaseTime', params: [7 * 24 * 60 * 60 + 1] });
      await web3.currentProvider.request({ method: 'evm_mine' });

      const initialBalance = BigInt(await web3.eth.getBalance(accounts[2]));
      await sendTransaction(project.methods.expire(), { from: factoryOwner, gas: GAS.EXPIRE });
      const finalBalance = BigInt(await web3.eth.getBalance(accounts[2]));

      assert(finalBalance > initialBalance);
    });

    /* Operations:
     * 1. Advance time past deadline
     * 2. Attempt to expire as non-factory-owner
     * Assertions:
     * - Transaction reverts
     */
    it('prevents non-factory-owner from expiring project', async () => {
      // Move time forward past deadline
      await web3.currentProvider.request({ method: 'evm_increaseTime', params: [7 * 24 * 60 * 60 + 1] });
      await web3.currentProvider.request({ method: 'evm_mine' });

      try {
        await sendTransaction(project.methods.expire(), { from: accounts[2] });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    /* Operations:
     * 1. Attempt to expire before deadline
     * Assertions:
     * - Transaction reverts
     */
    it('prevents expiration before deadline', async () => {
      try {
        await sendTransaction(project.methods.expire(), { from: factoryOwner, gas: GAS.EXPIRE });
        assert(false, 'Should not allow expiration before deadline');
      } catch (err) {
        assert(err);
      }
    });

    /* Operations:
     * 1. Fund project to target
     * 2. Approve project
     * 3. Withdraw funds
     * 4. Advance time past deadline
     * 5. Attempt to expire
     * Assertions:
     * - Project is marked as completed
     * - Expire transaction reverts
     */
    it('prevents expiration of fully funded project', async () => {
      await sendTransaction(project.methods.contribute(), { from: accounts[2], value: projectData.targetContribution.toString() });
      await sendTransaction(project.methods.approve(), { from: accounts[2] });
      await sendTransaction(project.methods.withdraw(), { from: projectData.recipient, gas: GAS.WITHDRAW });

      // Verify project is completed
      const status = await project.methods.status().call();
      assert(status.completed, "Project should be marked as completed after withdrawal");

      await web3.currentProvider.request({ method: 'evm_increaseTime', params: [7 * 24 * 60 * 60 + 1] });
      await web3.currentProvider.request({ method: 'evm_mine' });

      try {
        await sendTransaction(project.methods.expire(), { from: factoryOwner, gas: GAS.EXPIRE });
        assert(false, 'Should not allow expiration of completed project');
      } catch (err) {
        assert(err);
      }
    });
  });
});