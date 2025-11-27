import React, { useState, useEffect } from 'react';

const UniswapTokenIcon = ({ symbol, size = 24, className = '', fallback = null }) => {
  const [logoURI, setLogoURI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Map of token symbols to their Uniswap token list entries
  const tokenMap = {
    'ETH': {
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      chainId: 1
    },
    'WETH': {
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      chainId: 1
    },
    'USDC': {
      name: 'USDCoin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1
    },
    'EUR': {
      name: 'Euro Coin',
      address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      chainId: 1
    },
    'EURC': {
      name: 'Euro Coin',
      address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      chainId: 1
    }
  };

  useEffect(() => {
    const fetchTokenLogo = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Handle special cases and map to correct symbols
        let tokenSymbol = symbol;
        
        // For ETH, we use WETH since ETH is native token and doesn't have a logo URI in some contexts
        if (symbol === 'ETH') {
          tokenSymbol = 'ETH';
        }
        
        if (tokenMap[tokenSymbol]) {
          // Use the direct logo URI from our mapping
          const tokenInfo = tokenMap[tokenSymbol];
          const uri = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenInfo.address}/logo.png`;
          setLogoURI(uri);
        } else {
          // Try to fetch from Uniswap token list
          const response = await fetch('https://tokens.uniswap.org/');
          const data = await response.json();
          
          const token = data.tokens.find(t => 
            t.symbol === tokenSymbol && 
            t.chainId === 1
          );
          
          if (token && token.logoURI) {
            setLogoURI(token.logoURI);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error('Error fetching token logo:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchTokenLogo();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [symbol]);

  // Show fallback while loading or if there's an error
  if (loading || error || !logoURI) {
    if (fallback) {
      return fallback;
    }
    
    // Default fallback - colored circle with token symbol
    const bgColorMap = {
      'ETH': 'bg-gray-400',
      'USDC': 'bg-blue-500',
      'EUR': 'bg-green-500',
      'EURC': 'bg-green-500',
      'WETH': 'bg-gray-400',
      default: 'bg-gray-300'
    };
    
    const bgColor = bgColorMap[symbol] || bgColorMap.default;
    
    return (
      <div 
        className={`flex items-center justify-center rounded-full ${bgColor} text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol?.substring(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={logoURI} 
      alt={symbol}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
};

export default UniswapTokenIcon;