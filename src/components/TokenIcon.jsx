import React from 'react';

const TokenIcon = ({ symbol, size = 24, className = '' }) => {
  // List of supported tokens
  const supportedTokens = ['ETH', 'USDT', 'USDC', 'EURO', 'ARC', 'DAI', 'WBTC', 'BNB'];
  
  // Check if we have a custom icon for this token
  const hasCustomIcon = supportedTokens.includes(symbol?.toUpperCase());
  
  if (hasCustomIcon) {
    // Use our custom SVG icons
    return (
      <img 
        src={`/icons/${symbol.toUpperCase()}.svg`} 
        alt={symbol}
        width={size}
        height={size}
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