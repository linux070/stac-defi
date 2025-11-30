import React from 'react';

const TokenIcon = ({ symbol, size = 24, className = '' }) => {
  // Map token symbols to simple text representations
  const tokenTextMap = {
    'ETH': 'Ξ',
    'USDC': 'USD',
    'EUR': '€',
  };

  const text = tokenTextMap[symbol?.toUpperCase()] || symbol?.substring(0, 3).toUpperCase();
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {text}
    </div>
  );
};

export default TokenIcon;