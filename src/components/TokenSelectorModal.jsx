import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader, Search } from 'lucide-react';
import useTokenBalance from '../hooks/useTokenBalance';
import { NETWORKS } from '../config/networks';

// Token icon mapping
const getTokenIcon = (symbol) => {
    const iconMap = {
        'USDC': '/icons/usdc.png',
        'STC': '/icons/STC.png',
        'BALL': '/icons/ball.jpg',
        'MTB': '/icons/MTB.png',
        'ECR': '/icons/ECR.png'
    };
    return iconMap[symbol] || null;
};

// Network icon mapping
const getNetworkIcon = (chainId) => {
    const networkIconMap = {
        '0x4cef52': '/icons/Arc.png',      // Arc Testnet
        '0xaa36a7': '/icons/ethereum.png', // Sepolia
        '0x14a34': '/icons/base.png',      // Base Sepolia
    };
    return networkIconMap[chainId] || '/icons/ethereum.png';
};

// Get network name from chainId
const getNetworkName = (chainId) => {
    const networkNames = {
        '0x4cef52': 'Arc',
        '0xaa36a7': 'Sepolia',
        '0x14a34': 'Base',
    };
    return networkNames[chainId] || 'Unknown';
};

// Truncate address to format: 0x7f...2ca0
const truncateAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

// Get token address for current chain
const getTokenAddressForChain = (token, chainId) => {
    if (!token || !token.address) return null;

    if (typeof token.address === 'string') {
        return token.address;
    }

    if (typeof token.address === 'object') {
        return token.address[chainId] || Object.values(token.address)[0] || null;
    }

    return null;
};

// Composite Badge Icon Component
const TokenBadgeIcon = ({ tokenSymbol, chainId, size = 44 }) => {
    const tokenIcon = getTokenIcon(tokenSymbol);
    const networkIcon = getNetworkIcon(chainId);
    const networkSize = Math.round(size * 0.4);

    return (
        <div className="token-badge-container" style={{ width: size, height: size }}>
            {tokenIcon ? (
                <img
                    src={tokenIcon}
                    alt={tokenSymbol}
                    className="token-badge-logo"
                />
            ) : (
                <div className="token-badge-logo token-badge-fallback">
                    <span>{tokenSymbol?.charAt(0) || '?'}</span>
                </div>
            )}
            <img
                src={networkIcon}
                alt={getNetworkName(chainId)}
                className="token-badge-network"
                style={{ width: networkSize, height: networkSize }}
            />
        </div>
    );
};

// Token Row Component
const TokenRow = ({
    token,
    chainId,
    selectedToken,
    exclude,
    onSelect,
    onClose,
    isConnected,
    t
}) => {
    const { balance: tokenBalance, loading: tokenLoading } = useTokenBalance(token.symbol);
    const isSelected = token.symbol === selectedToken;
    const isExcluded = token.symbol === exclude;
    const tokenAddress = getTokenAddressForChain(token, chainId);

    return (
        <button
            onClick={() => {
                onSelect(token.symbol);
                onClose();
            }}
            disabled={isExcluded}
            className={`swap-token-selector-list-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
        >
            <div className="swap-token-selector-list-item-content">
                <TokenBadgeIcon tokenSymbol={token.symbol} chainId={chainId} size={44} />
                <div className="swap-token-selector-list-info">
                    <p className="swap-token-selector-list-symbol">{token.symbol || 'Unknown'}</p>
                    <p className="swap-token-selector-list-address">
                        <span>{getNetworkName(chainId)}</span>
                        {tokenAddress && (
                            <>
                                <span className="address-separator">•</span>
                                <span className="truncated-address">{truncateAddress(tokenAddress)}</span>
                            </>
                        )}
                    </p>
                </div>
            </div>
            {isConnected && (
                <div className="swap-token-selector-list-balance">
                    <p className="swap-token-selector-list-balance-amount">
                        {tokenLoading ? <Loader size={12} className="animate-spin" /> : tokenBalance || '0.00'}
                    </p>
                    <p className="swap-token-selector-list-balance-label">{t('balance')}</p>
                </div>
            )}
        </button>
    );
};

// Network Filter Pills for Mobile
const NetworkFilterBar = ({ activeFilter, onFilterChange }) => {
    const networks = [
        { id: 'all', label: 'All' },
        { id: '0x4cef52', label: 'Arc' },
        { id: '0xaa36a7', label: 'Sepolia' },
        { id: '0x14a34', label: 'Base' },
    ];

    return (
        <div className="network-filter-bar">
            {networks.map((network) => (
                <button
                    key={network.id}
                    onClick={() => onFilterChange(network.id)}
                    className={`network-filter-pill ${activeFilter === network.id ? 'active' : ''}`}
                >
                    {network.id !== 'all' && (
                        <img
                            src={getNetworkIcon(network.id)}
                            alt={network.label}
                            className="network-filter-icon"
                        />
                    )}
                    {network.label}
                </button>
            ))}
        </div>
    );
};

// Main Token Selector Modal Component
const TokenSelectorModal = ({
    isOpen,
    onClose,
    selectedToken,
    onSelect,
    exclude,
    tokenList,
    chainId,
    isConnected,
    t,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [networkFilter, setNetworkFilter] = useState('all');
    const selectorRef = useRef(null);
    const searchInputRef = useRef(null);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Filter tokens based on search query
    const filteredTokens = useMemo(() => {
        if (!searchQuery) return tokenList;

        const query = searchQuery.toLowerCase();
        return tokenList.filter(token =>
            token &&
            token.symbol &&
            typeof token.symbol === 'string' &&
            (token.symbol.toLowerCase().includes(query) ||
                (token.name && typeof token.name === 'string' && token.name.toLowerCase().includes(query)) ||
                (token.address && typeof token.address === 'string' && token.address.toLowerCase().includes(query)) ||
                (token.address && typeof token.address === 'object' &&
                    Object.values(token.address).some(addr => typeof addr === 'string' && addr.toLowerCase().includes(query))))
        );
    }, [searchQuery, tokenList]);

    // Popular tokens for quick selection
    const popularTokens = useMemo(() => {
        return tokenList.filter(token =>
            token &&
            token.symbol &&
            typeof token.symbol === 'string' &&
            ['USDC', 'STC', 'BALL', 'MTB', 'ECR'].includes(token.symbol)
        );
    }, [tokenList]);

    // Handle ESC key press to close modal
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // Reset search and filter when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setNetworkFilter('all');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="swap-token-selector-modal-backdrop"
            onClick={onClose}
        >
            <div
                ref={selectorRef}
                className="swap-token-selector-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="swap-token-selector-header">
                    <h3 className="swap-token-selector-title">{t('Select Token')}</h3>
                    <button
                        onClick={onClose}
                        className="swap-token-selector-close-button"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="swap-token-selector-search">
                    <div className="swap-token-selector-search-wrapper">
                        <Search size={18} className="swap-token-selector-search-icon" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t('Search Tokens')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="swap-token-selector-search-input"
                        />
                    </div>
                </div>

                {/* Mobile Network Filter Bar */}
                <NetworkFilterBar
                    activeFilter={networkFilter}
                    onFilterChange={setNetworkFilter}
                />

                {/* Popular Tokens */}
                <div className="swap-token-selector-popular-section">
                    <h4 className="swap-token-selector-popular-label">{t('Your Tokens')}</h4>
                    <div className="swap-token-selector-popular-tokens">
                        {popularTokens.map((token) => {
                            if (!token || !token.symbol || typeof token.symbol !== 'string') {
                                return null;
                            }

                            const isExcluded = token.symbol === exclude;
                            const isSelected = token.symbol === selectedToken;

                            return (
                                <button
                                    key={`popular-${token.symbol}`}
                                    onClick={() => {
                                        onSelect(token.symbol);
                                        onClose();
                                    }}
                                    className={`swap-token-selector-popular-button ${isSelected ? 'active' : ''} ${isExcluded ? 'disabled' : ''}`}
                                >
                                    <TokenBadgeIcon tokenSymbol={token.symbol} chainId={chainId} size={24} />
                                    <span className="swap-token-selector-popular-symbol">{token.symbol}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Token List */}
                <div className="swap-token-selector-list">
                    {filteredTokens.map((token) => (
                        <TokenRow
                            key={token.symbol}
                            token={token}
                            chainId={chainId}
                            selectedToken={selectedToken}
                            exclude={exclude}
                            onSelect={onSelect}
                            onClose={onClose}
                            isConnected={isConnected}
                            t={t}
                        />
                    ))}

                    {filteredTokens.length === 0 && searchQuery && (
                        <div className="swap-token-selector-empty">
                            <p>{t('noTokensFound')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TokenSelectorModal;
