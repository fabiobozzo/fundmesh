const truncateEthAddress = (address) => {
  const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

const formatEther = (wei) => {
  // Convert wei to ether (1 ether = 10^18 wei)
  const ether = Number(wei) / 1e18;
  // Format to max 4 decimal places
  return ether.toFixed(4);
};

const formatDeadline = (timestamp) => {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = timestamp - now;
  
  if (timeLeft <= 0) return 'Ended';
  
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

export const getEtherscanUrl = (address) => {
  const network = process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia';
  const baseUrl = network === 'mainnet' ? 'https://etherscan.io' : `https://${network}.etherscan.io`;
  return `${baseUrl}/address/${address}`;
};

export {
  truncateEthAddress,
  formatEther,
  formatDeadline
};