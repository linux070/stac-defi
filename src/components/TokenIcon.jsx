import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthereum, faBitcoin } from '@fortawesome/free-brands-svg-icons';
import { faDollarSign, faEuroSign } from '@fortawesome/free-solid-svg-icons';

const TokenIcon = ({ symbol, size = 24, className = '' }) => {
  // Map token symbols to FontAwesome icons
  const tokenIconMap = {
    'ETH': faEthereum,
    'BTC': faBitcoin,
    'WBTC': faBitcoin,
    'USDC': faDollarSign,
    'USDT': faDollarSign,
    'DAI': faDollarSign,
    'EUR': faEuroSign,
    'EURO': faEuroSign,
    'ARC': faEthereum, // Using Ethereum icon as placeholder for ARC
    'BNB': faEthereum, // Using Ethereum icon as placeholder for BNB
  };

  const icon = tokenIconMap[symbol?.toUpperCase()];
  
  if (icon) {
    return (
      <FontAwesomeIcon 
        icon={icon} 
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback to a generic circle with token symbol
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {symbol?.substring(0, 3).toUpperCase()}
    </div>
  );
};

export default TokenIcon;