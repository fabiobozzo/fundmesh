import { Web3 } from "web3";

const web3Errors = {
  'invalidWallet': 'Injected Wallet not found'
}

const getWeb3 = async () => {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    // We are in the browser and metamask is running.
    await window.ethereum.request({ method: "eth_requestAccounts" });

    return new Web3(window.ethereum);
  }

  throw new Error(web3Errors['invalidWallet']);
};

const getWeb3SSR = async () => {
  // We are on the server *OR* the user is not running metamask
  const provider = new Web3.providers.HttpProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`
  );

  return new Web3(provider);
};

export {
  getWeb3,
  getWeb3SSR,
  web3Errors
};