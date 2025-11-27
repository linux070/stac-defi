import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEthereum, faBitcoin, faBtc } from '@fortawesome/free-brands-svg-icons';
import { faExchangeAlt, faLink, faTint, faChartLine, faDollarSign, faReceipt, faUsers, faCoins, faBolt, faCubes, faBook, faCircleDollarToSlot, faMoneyBillTrendUp, faMoneyBillWave, faEuroSign } from '@fortawesome/free-solid-svg-icons';
import TokenIcon from './TokenIcon';
import UniswapTokenIcon from './UniswapTokenIcon';

// Add icons to the library
library.add(faExchangeAlt, faLink, faTint, faChartLine, faDollarSign, faReceipt, faUsers, faCoins, faBolt, faCubes, faBook, faEthereum, faBitcoin, faBtc, faCircleDollarToSlot, faMoneyBillTrendUp, faMoneyBillWave, faEuroSign);

// Map icon names to actual icon objects
const iconMap = {
  'exchange-alt': faExchangeAlt,
  'link': faLink,
  'tint': faTint,
  'chart-line': faChartLine,
  'receipt': faReceipt,
  'users': faUsers,
  'coins': faCoins,
  'bolt': faBolt,
  'cubes': faCubes,
  'book': faBook,
  'ethereum': faEthereum,
  'bitcoin': faBitcoin,
  'btc': faBtc,
  'usd-circle': faCircleDollarToSlot, // USDC (Circle)
  'dollar-sign': faDollarSign, // USDT
  'money-bill-trend-up': faMoneyBillTrendUp, // DAI
  'money-bill-wave': faMoneyBillWave, // Alternative for stablecoins
  'euro-sign': faEuroSign // EUR
};

// Import Web3Icons
import { CryptoIcon } from '@web3icons/react';

const FAIcon = ({ icon, size = '1x', color, className = '', useWeb3Icon = false, tokenSymbol, useCustomTokenIcon = false, useUniswapIcon = false, ...props }) => {
  // Use Uniswap token icons when specified
  if (useUniswapIcon && tokenSymbol) {
    const sizeValue = size === '1x' ? 24 : size === 'lg' ? 32 : 16;
    return <UniswapTokenIcon symbol={tokenSymbol} size={sizeValue} className={className} />;
  }
  
  // Use our custom token icons when specified
  if (useCustomTokenIcon && tokenSymbol) {
    const sizeValue = size === '1x' ? 24 : size === 'lg' ? 32 : 16;
    return <TokenIcon symbol={tokenSymbol} size={sizeValue} className={className} />;
  }
  
  // Use Web3Icons for better token representations when specified
  if (useWeb3Icon && tokenSymbol) {
    return (
      <CryptoIcon 
        symbol={tokenSymbol} 
        size={size === '1x' ? 24 : size === 'lg' ? 32 : 16}
        className={className}
        {...props}
      />
    );
  }
  
  const iconObj = iconMap[icon] || faExchangeAlt; // fallback to exchange-alt if icon not found
  
  return (
    <FontAwesomeIcon 
      icon={iconObj} 
      size={size}
      color={color}
      className={className}
      {...props}
    />
  );
};

export default FAIcon;