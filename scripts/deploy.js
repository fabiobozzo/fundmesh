const HDWalletProvider = require('@truffle/hdwallet-provider');
const { Web3 } = require('web3');
const compiledFactory = require('../build/ProjectFactory.json')

require('dotenv').config();

const provider = new HDWalletProvider(process.env.WALLET_SRP, process.env.INFURA_ENDPOINT);

const web3 = new Web3(provider);

const deploy = async () => {
    try {
        const accounts = await web3.eth.getAccounts();

        console.log('Contract creator:', accounts[0]);
        console.log('Attempting to deploy contract...');

        result = await new web3.eth.Contract(compiledFactory.abi)
            .deploy({ data: compiledFactory.evm.bytecode.object })
            .send({ gas: '14000000', from: accounts[0] });

        console.log('✅ Contract deployed to:', result.options.address);

    } catch (err) {
        console.log('❌ Deployment failed:', err);
    } finally {
        provider.engine.stop();
    }
};

deploy();
