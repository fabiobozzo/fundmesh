const assert = require('assert');
const ganache = require('ganache');
const { Web3 } = require('web3');
const web3 = new Web3(ganache.provider({ logging: { quiet: true }}));

const compiledUserRegistry = require('../build/UserRegistry.json');

let accounts;
let userRegistry;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    
    userRegistry = await new web3.eth.Contract(compiledUserRegistry.abi)
        .deploy({ data: compiledUserRegistry.evm.bytecode.object })
        .send({ from: accounts[0], gas: '3000000' });
});

describe('UserRegistry', () => {
    it('deploys successfully', () => {
        assert.ok(userRegistry.options.address);
    });

    it('allows users to create and update their own profiles', async () => {
        const testCid = 'QmTest123';
        
        await userRegistry.methods
            .updateProfile(accounts[0], testCid)
            .send({ from: accounts[0], gas: '200000' });

        const profile = await userRegistry.methods
            .getProfile(accounts[0])
            .call();

        assert.equal(profile.exists, true);
        assert.equal(profile.profileCid, testCid);
        assert(profile.updatedAt > 0);
    });

    it('emits event when profile is updated', async () => {
        const testCid = 'QmTest123';
        
        const receipt = await userRegistry.methods
            .updateProfile(accounts[0], testCid)
            .send({ from: accounts[0], gas: '200000' });

        const event = receipt.events.ProfileUpdated;
        assert.ok(event);
        assert.equal(event.returnValues.user, accounts[0]);
        assert.equal(event.returnValues.profileCid, testCid);
        assert(event.returnValues.timestamp > 0);
    });

    it('allows users to update their existing profiles', async () => {
        const initialCid = 'QmTest123';
        const updatedCid = 'QmTest456';
        
        await userRegistry.methods
            .updateProfile(accounts[0], initialCid)
            .send({ from: accounts[0], gas: '200000' });

        await userRegistry.methods
            .updateProfile(accounts[0], updatedCid)
            .send({ from: accounts[0], gas: '200000' });

        const profile = await userRegistry.methods
            .getProfile(accounts[0])
            .call();

        assert.equal(profile.profileCid, updatedCid);
    });

    it('correctly reports profile existence', async () => {
        let hasProfile = await userRegistry.methods
            .hasProfile(accounts[1])
            .call();
        assert.equal(hasProfile, false);

        await userRegistry.methods
            .updateProfile(accounts[1], 'QmTest123')
            .send({ from: accounts[1], gas: '200000' });

        hasProfile = await userRegistry.methods
            .hasProfile(accounts[1])
            .call();
        assert.equal(hasProfile, true);
    });

    it('prevents users from updating other users profiles', async () => {
        const testCid = 'QmTest123';
        
        try {
            await userRegistry.methods
                .updateProfile(accounts[1], testCid)
                .send({ from: accounts[0], gas: '200000' });
            assert(false, 'Transaction should have failed');
        } catch (err) {
            assert(err instanceof Error);
            assert(err.message.includes('Transaction has been reverted by the EVM'));
            assert.equal(err.receipt.status, 0n); // Check that transaction was reverted
        }
    });
}); 