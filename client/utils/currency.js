import { formatEther } from '@/utils/web3';

const formatWei = (wei) => {
  if (!wei) return '0';
  return Number(wei).toLocaleString();
};

const formatAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  return (Number(amount) / Math.pow(10, decimals)).toLocaleString();
};

const formatETH = (wei, precision = 6) => {
  if (!wei) return '0';
  // Convert to number and format with fixed precision
  const num = Number(wei) / 1e18;
  // Use toFixed to avoid scientific notation, then remove trailing zeros
  return num.toFixed(precision).replace(/\.?0+$/, '');
};

export { formatWei, formatAmount, formatETH }; 