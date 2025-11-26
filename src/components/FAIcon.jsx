import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEthereum, faBitcoin, faBtc } from '@fortawesome/free-brands-svg-icons';
import { faExchangeAlt, faLink, faTint, faChartLine, faDollarSign, faReceipt, faUsers, faCoins, faBolt, faCubes, faBook, faCircleDollarToSlot, faMoneyBillTrendUp, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

// Add icons to the library
library.add(faExchangeAlt, faLink, faTint, faChartLine, faDollarSign, faReceipt, faUsers, faCoins, faBolt, faCubes, faBook, faEthereum, faBitcoin, faBtc, faCircleDollarToSlot, faMoneyBillTrendUp, faMoneyBillWave);

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
  'money-bill-wave': faMoneyBillWave // Alternative for stablecoins
};

const FAIcon = ({ icon, size = '1x', color, className = '', ...props }) => {
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