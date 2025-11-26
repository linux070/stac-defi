import React from 'react';
import FAIcon from './FAIcon';

const TestFAIcons = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Font Awesome Icon Test</h2>
      <div className="flex space-x-4">
        <FAIcon icon="exchange-alt" size="2x" className="text-blue-500" />
        <FAIcon icon="link" size="2x" className="text-green-500" />
        <FAIcon icon="tint" size="2x" className="text-purple-500" />
        <FAIcon icon="chart-line" size="2x" className="text-red-500" />
        <FAIcon icon="dollar-sign" size="2x" className="text-yellow-500" />
        <FAIcon icon="usd-circle" size="2x" className="text-green-500" />
        <FAIcon icon="ethereum" size="2x" className="text-gray-500" />
        <FAIcon icon="btc" size="2x" className="text-orange-500" />
      </div>
    </div>
  );
};

export default TestFAIcons;