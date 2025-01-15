import { formatEther } from '@/utils/web3';

const formatWei = (wei) => {
  const value = BigInt(wei);
  if (value < BigInt(1000)) return `${value} WEI`;
  if (value < BigInt(1000000)) return `${Number(value)/1000}K WEI`;
  if (value < BigInt(1000000000)) return `${Number(value)/1000000}M WEI`;
  return `${Number(value)/1000000000}B WEI`;
};

const formatAmount = (valueInWei) => {
  if (!valueInWei) return '0 ETH';
  
  const weiValue = BigInt(valueInWei);
  if (weiValue === BigInt(0)) return '0 ETH';
  
  // For amounts less than 0.001 ETH, show in Wei
  if (weiValue < BigInt(1e15)) {
    return formatWei(weiValue.toString());
  }
  
  return formatETH(valueInWei);
};

const formatETH = (wei) => {
  // Convert wei to ETH and remove trailing zeros, but keep necessary decimals
  const eth = (Number(wei) / 1e18).toFixed(6)  // Keep 6 decimal places
  return `${eth.replace(/\.?0+$/, '')} ETH`
}

export {
  formatWei,
  formatAmount,
  formatETH
}; 