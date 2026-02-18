import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowDown,
    Zap,
    Loader,
    RefreshCcw,
    Settings,
    Fuel,
    AlertTriangle,
} from 'lucide-react';

import '../styles/swap-styles.css';
import { validateSlippage } from '../utils/blockchain';

const DotProgress = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);
        return () => clearInterval(interval);
    }, []);
    return <span className="inline-block w-8 text-left">{dots}</span>;
};

const SwapModal = ({
    isOpen,
    onClose,
    onError,
    onSuccess,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    swapState,
    slippage,
    setSlippage
}) => {
    const [isEditingSlippage, setIsEditingSlippage] = useState(false);
    const [tempSlippage, setTempSlippage] = useState('');
    const [slippageWarning, setSlippageWarning] = useState('');
    const { t } = useTranslation();

    const formatAmount = (val) => {
        if (!val) return '0.00';
        const num = parseFloat(val);
        if (num === 0) return '0.00';
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatPrice = (val) => {
        if (!val) return '0.00';
        const num = parseFloat(val);
        if (num === 0) return '0.00';

        // Use more decimals for small prices
        const decimals = num < 0.1 ? 6 : (num < 1 ? 4 : 2);

        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: decimals
        });
    };

    const getTokenIcon = (symbol) => {
        if (!symbol) return null;
        const s = String(symbol).toUpperCase();
        const iconMap = {
            'USDC': '/icons/usdc.png',
            'STC': '/icons/stac.png',
            'STAC': '/icons/stac.png',
            'BALL': '/icons/ball.png',
            'MTB': '/icons/mtb.png',
            'ECR': '/icons/ecr.png',
            'ETH': '/icons/eth.png',
            'EURC': '/icons/eurc.png'
        };
        return iconMap[s] || null;
    };

    const {
        needsApproval,
        handleApprove,
        handleSwap,
        isApproving,
        approveSuccess,
        isSwapping,
        isLoading,
        isSuccess,
        txHash,
        error,
        price,
        priceImpact,
        swapStep,
        isTokenToToken
    } = swapState;

    useEffect(() => {
        if (isSuccess) {
            console.log("Swap flow completed successfully");
        }
    }, [isSuccess]);

    const [frozenData, setFrozenData] = useState(null);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [hasResetOnOpen, setHasResetOnOpen] = useState(false);

    // Reset swap state only when modal first opens
    useEffect(() => {
        if (isOpen && !hasResetOnOpen && swapState.reset) {
            swapState.reset();
            setHasResetOnOpen(true);
        }
        if (!isOpen) {
            setHasResetOnOpen(false);
        }
    }, [isOpen, hasResetOnOpen, swapState]);

    useEffect(() => {
        if (isOpen && fromAmount && toAmount && parseFloat(toAmount) > 0) {
            // Only set or update frozenData if we have valid non-zero amounts
            // This prevents freezing a "0" or "Calculating" state
            if (!frozenData || (parseFloat(frozenData.toAmount || "0") === 0)) {
                const computedPrice = parseFloat(fromAmount) > 0
                    ? (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(8)
                    : null;

                setFrozenData({
                    fromAmount,
                    toAmount,
                    fromToken,
                    toToken,
                    price: price || computedPrice,
                    priceImpact
                });
            }
        }
    }, [isOpen, fromAmount, toAmount, fromToken, toToken, frozenData, price, priceImpact]);

    useEffect(() => {
        if (!isOpen) {
            setFrozenData(null);
            setButtonLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (error && onError && isOpen) {
            onError(error);
            setButtonLoading(false);
        }
    }, [error, onError, isOpen]);

    useEffect(() => {
        if (txHash && onSuccess && isOpen) {
            if (!isTokenToToken || swapStep === 2) {
                onSuccess(txHash);
                setButtonLoading(false);
            } else {
                console.log("Leg 1 swap hash received:", txHash);
            }
        }
    }, [txHash, onSuccess, isOpen, isTokenToToken, swapStep]);

    // Handle Auto-Swap after Approval OR Step transition
    useEffect(() => {
        if (!isOpen || !buttonLoading) return;

        if (approveSuccess && needsApproval === false) {
            handleSwap();
        }

        if (isTokenToToken && swapStep === 2 && !isSwapping && !isApproving) {
            if (needsApproval) {
                handleApprove();
            } else {
                handleSwap();
            }
        }
    }, [approveSuccess, buttonLoading, isOpen, needsApproval, handleSwap, isTokenToToken, swapStep, isSwapping, isApproving, handleApprove]);

    useEffect(() => {
        let warning = '';
        if (slippage) {
            try {
                const result = validateSlippage(slippage);
                warning = result.warning || '';
            } catch (e) {
                warning = e.message;
            }
        }

        const amountNum = parseFloat(frozenData?.fromAmount || fromAmount);
        if (amountNum >= 100 && !warning) {
            warning = t('Large transaction: High price impact possible');
        }

        setSlippageWarning(warning);
    }, [slippage, fromAmount, frozenData, t]);

    if (!isOpen) return null;

    // Compute display values
    const displayFromSymbol = frozenData?.fromToken?.symbol || fromToken?.symbol;
    const displayToSymbol = frozenData?.toToken?.symbol || toToken?.symbol;
    const displayFromAmount = frozenData?.fromAmount || fromAmount;
    const displayToAmount = frozenData?.toAmount || toAmount;

    // Calculate price rate — consistent logic:
    // Selling (Token → USDC): "1 STC = 0.72 USDC"
    // Buying (USDC → Token): "1 USDC = 1.39 STC"
    const computePriceDisplay = () => {
        const isBuying = displayFromSymbol === 'USDC';

        // Primary: derive rate from actual from/to amounts
        const fAmount = parseFloat(displayFromAmount);
        const tAmount = parseFloat(displayToAmount);

        if (fAmount > 0 && tAmount > 0) {
            if (isBuying) {
                // USDC → Token: show how many tokens per 1 USDC
                const rate = tAmount / fAmount;
                return `1 USDC = ${formatPrice(rate)} ${displayToSymbol}`;
            } else {
                // Token → USDC: show how much USDC per 1 token
                const rate = tAmount / fAmount;
                return `1 ${displayFromSymbol} = ${formatPrice(rate)} ${displayToSymbol}`;
            }
        }

        // Fallback: use the price from useSwap hook (token's USDC price)
        const rawPrice = parseFloat(frozenData?.price || price);
        if (!rawPrice || rawPrice <= 0) return t('Calculating...');

        if (isBuying) {
            // price = token USDC price (e.g. 0.72 for STC)
            // So 1 USDC buys 1/0.72 = 1.39 STC
            const tokensPerUSDC = 1 / rawPrice;
            return `1 USDC = ${formatPrice(tokensPerUSDC)} ${displayToSymbol}`;
        } else {
            // 1 STC = 0.72 USDC (the price IS the USDC value)
            return `1 ${displayFromSymbol} = ${formatPrice(rawPrice)} ${displayToSymbol}`;
        }
    };

    const slippageLabel = slippage === 0.5 ? t('Auto') : t('Custom');

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="swap-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="swap-modal-container swap-confirm-modal"
                        initial={{ scale: 0.95, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="swap-modal-close-button-alt"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="swap-modal-content">
                            {/* Title */}
                            <h2 className="swap-confirm-title">{t("Confirm Swap")}</h2>

                            {/* From Section */}
                            <div className="swap-confirm-token-section">
                                <div className="swap-confirm-token-row">
                                    <div className="swap-confirm-token-icon">
                                        {getTokenIcon(displayFromSymbol) ? (
                                            <img src={getTokenIcon(displayFromSymbol)} alt={displayFromSymbol} />
                                        ) : (
                                            <span className="swap-confirm-token-fallback">{displayFromSymbol?.[0] || '?'}</span>
                                        )}
                                    </div>
                                    <div className="swap-confirm-token-info">
                                        <span className="swap-confirm-token-label">{t('FROM')}</span>
                                        <span className="swap-confirm-token-amount">{formatAmount(displayFromAmount)} {displayFromSymbol}</span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="swap-confirm-arrow">
                                    <ArrowDown size={16} strokeWidth={3} />
                                </div>

                                {/* To Row */}
                                <div className="swap-confirm-token-row">
                                    <div className="swap-confirm-token-icon">
                                        {getTokenIcon(displayToSymbol) ? (
                                            <img src={getTokenIcon(displayToSymbol)} alt={displayToSymbol} />
                                        ) : (
                                            <span className="swap-confirm-token-fallback">{displayToSymbol?.[0] || '?'}</span>
                                        )}
                                    </div>
                                    <div className="swap-confirm-token-info">
                                        <span className="swap-confirm-token-label">{t('TO (ESTIMATED)')}</span>
                                        <span className="swap-confirm-token-amount">{formatAmount(displayToAmount)} {displayToSymbol}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details Rows */}
                            <div className="swap-confirm-details">
                                {/* Price Row */}
                                <div className="swap-confirm-detail-row">
                                    <div className="swap-confirm-detail-left">
                                        <RefreshCcw size={15} />
                                        <span>{t('Price')}</span>
                                    </div>
                                    <span className="swap-confirm-detail-value swap-confirm-detail-mono">
                                        {computePriceDisplay()}
                                    </span>
                                </div>

                                {/* Price Impact Row */}
                                <div className="swap-confirm-detail-row">
                                    <div className="swap-confirm-detail-left">
                                        <Zap size={15} />
                                        <span>{t('Price Impact')}</span>
                                    </div>
                                    <span className={`swap-confirm-detail-value ${parseFloat(frozenData?.priceImpact || priceImpact) > 5 ? 'swap-confirm-danger' : 'swap-confirm-success'}`}>
                                        {frozenData?.priceImpact || priceImpact || '< 0.01'}%
                                    </span>
                                </div>

                                {/* Slippage Row */}
                                <div className="swap-confirm-detail-row">
                                    <div className="swap-confirm-detail-left">
                                        <Settings size={15} />
                                        <span>{t('Slippage')}</span>
                                        {slippageWarning && (
                                            <div className="swap-confirm-tooltip-container group/tooltip">
                                                <AlertTriangle size={13} className="text-amber-500 cursor-help" />
                                                <div className="swap-confirm-tooltip">
                                                    {slippageWarning}
                                                    <div className="swap-confirm-tooltip-arrow"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="swap-confirm-detail-right">
                                        {isEditingSlippage ? (
                                            <div className="swap-confirm-slippage-edit">
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="0.1"
                                                    className="swap-confirm-slippage-input"
                                                    placeholder="0.5"
                                                    value={tempSlippage}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setTempSlippage(val);
                                                        if (val !== '' && !isNaN(parseFloat(val)) && parseFloat(val) > 0) {
                                                            setSlippage(parseFloat(val));
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (!tempSlippage) setSlippage(0.5);
                                                        setIsEditingSlippage(false);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') {
                                                            setIsEditingSlippage(false);
                                                        }
                                                    }}
                                                />
                                                <span className="swap-confirm-slippage-pct">%</span>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempSlippage(slippage?.toString() || '0.5');
                                                    setIsEditingSlippage(true);
                                                }}
                                                className="swap-confirm-slippage-btn"
                                            >
                                                <span className="swap-confirm-slippage-badge">{slippageLabel}</span>
                                                <span className="swap-confirm-slippage-value">{slippage}%</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Network Fee Row */}
                                <div className="swap-confirm-detail-row">
                                    <div className="swap-confirm-detail-left">
                                        <Fuel size={15} />
                                        <span>{t('Network Fee')}</span>
                                    </div>
                                    <div className="swap-confirm-detail-right">
                                        <div className="swap-confirm-fee-display">
                                            <span className="swap-confirm-fee-badge">Avg</span>
                                            <span className="swap-confirm-fee-value">~$0.0001</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => {
                                    setButtonLoading(true);
                                    if (needsApproval && !approveSuccess) {
                                        handleApprove();
                                    } else {
                                        handleSwap();
                                    }
                                }}
                                disabled={isLoading || buttonLoading}
                                className="swap-modal-action-button"
                            >
                                {isApproving || (buttonLoading && needsApproval && !approveSuccess) ? (
                                    <div className="flex items-center justify-center">
                                        <Loader className="animate-spin mr-2" size={20} />
                                        <span>{t('Approving')}</span>
                                        <DotProgress />
                                    </div>
                                ) : isSwapping || (buttonLoading && (!needsApproval || approveSuccess)) ? (
                                    <div className="flex items-center justify-center">
                                        <Loader className="animate-spin mr-2" size={20} />
                                        <span>{isTokenToToken ? (swapStep === 1 ? 'Step 1: Selling...' : 'Finalizing Swap...') : t('Swapping')}</span>
                                        <DotProgress />
                                    </div>
                                ) : needsApproval && !approveSuccess ? (
                                    `${t('Approve')} ${(isTokenToToken && swapStep === 2) ? 'USDC' : displayFromSymbol}`
                                ) : (
                                    <span className="font-semibold">
                                        {isTokenToToken && swapStep === 2 ? 'Complete Swap' : t('Confirm Swap')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SwapModal;