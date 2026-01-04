import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowDown,
    Check,
    Loader,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Info
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAccount } from 'wagmi';
import { getExplorerUrl } from '../utils/blockchain';
import { TOKEN_PRICES } from '../config/networks';
import { getItem, setItem } from '../utils/indexedDB';
import '../styles/swap-styles.css';

const SwapModal = ({
    isOpen,
    onClose,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    swapState
}) => {
    const { t } = useTranslation();

    // Helper to simplify technical RPC/Network errors
    const getCleanErrorMessage = (msg) => {
        if (!msg) return t('User rejected the transaction in wallet.');

        const lowerMsg = msg.toLowerCase();

        // User rejection
        if (lowerMsg.includes('user rejected') || lowerMsg.includes('user denied') || lowerMsg.includes('action_rejected')) {
            return t('Transaction cancelled: You rejected the request in your wallet.');
        }

        // Insufficient funds
        if (lowerMsg.includes('insufficient funds') || lowerMsg.includes('exceeds the balance')) {
            return t('Insufficient funds: You do not have enough native tokens to cover the gas fee.');
        }

        // Slippage / Price Impact
        if (lowerMsg.includes('slippage') || lowerMsg.includes('price impact') || lowerMsg.includes('too much')) {
            return t('Swap failed due to high price impact or slippage. Please try increasing your slippage tolerance.');
        }

        // RPC / Network Issues
        const isTechnicalError =
            lowerMsg.includes('http request failed') ||
            lowerMsg.includes('unterminated string') ||
            lowerMsg.includes('json') ||
            lowerMsg.includes('viem') ||
            lowerMsg.includes('drpc.org');

        if (isTechnicalError) {
            return t('Network error: The node is unresponsive. Please wait a moment and try again.');
        }

        // Fallback for short technical strings but not the massive dev call blocks
        if (msg.length > 150) {
            return t('The transaction was cancelled or failed on-chain. Please verify your wallet and try again.');
        }

        return msg;
    };

    const formatAmount = (val) => {
        if (!val) return '0.00';
        const num = parseFloat(val);
        if (num === 0) return '0.00';

        // Round to 2 decimal places (2 significant figures)
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getTokenIcon = (symbol) => {
        const iconMap = {
            'USDC': '/icons/usdc.png',
            'STCK': '/icons/stac.png',
            'BALL': '/icons/ball.jpg',
            'MTB': '/icons/MTB.png',
            'ECR': '/icons/ECR.png'
        };
        return iconMap[symbol] || null;
    };

    const { chainId } = useWallet();
    const { address } = useAccount();
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
        error
    } = swapState;

    const [step, setStep] = useState('confirm'); // confirm, processing, success, error
    const [frozenData, setFrozenData] = useState(null);

    // Reset the wagmi hook state to clear any stale success/tx hashes when modal opens
    useEffect(() => {
        if (isOpen && swapState.reset) {
            swapState.reset();
        }
    }, [isOpen]);

    // Freeze data when starting to prevent '0.000' if parent clears state
    useEffect(() => {
        if (isOpen && !frozenData && fromAmount && toAmount) {
            setFrozenData({
                fromAmount,
                toAmount,
                fromToken,
                toToken
            });
        }
    }, [isOpen, fromAmount, toAmount, fromToken, toToken, frozenData]);

    // Clear frozen data when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFrozenData(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isLoading) {
            setStep('processing');
        } else if (isSuccess) {
            setStep('success');
            // Log transaction to history
            if (txHash && address) {
                const logTransaction = async () => {
                    try {
                        const history = await getItem('myTransactions') || [];
                        const exists = history.some(tx => tx.hash === txHash);
                        if (!exists) {
                            // Use frozen data if available, otherwise current props
                            const dataToLog = frozenData || { fromAmount, toAmount, fromToken, toToken };
                            const newTx = {
                                id: txHash,
                                hash: txHash,
                                type: 'Swap',
                                from: `${dataToLog.fromAmount} ${dataToLog.fromToken?.symbol}`,
                                to: `${dataToLog.toAmount} ${dataToLog.toToken?.symbol}`,
                                amount: `${dataToLog.fromAmount} ${dataToLog.fromToken?.symbol} → ${dataToLog.toAmount} ${dataToLog.toToken?.symbol}`,
                                timestamp: Date.now(),
                                status: 'success',
                                address: address.toLowerCase(),
                                chainId: chainId
                            };
                            await setItem('myTransactions', [newTx, ...history].slice(0, 100));
                            // Dispatch event to update transaction page immediately
                            window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
                        }
                    } catch (err) {
                        console.error('Failed to log swap transaction:', err);
                    }
                };
                logTransaction();
            }
        } else if (error) {
            setStep('error');
        } else if (!isOpen || (!isLoading && !isSuccess)) {
            setStep('confirm');
        }
    }, [isLoading, isSuccess, error, isOpen, txHash, address, fromToken, toToken, fromAmount, toAmount, chainId, frozenData]);

    if (!isOpen) return null;

    const explorerUrl = txHash ? getExplorerUrl(txHash, chainId) : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center swap-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative swap-modal-container max-w-[440px] w-full mx-4 overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button (Absolute) - Always visible */}
                        <button
                            onClick={onClose}
                            className="swap-modal-close-button-alt"
                        >
                            <X size={20} />
                        </button>



                        <div className="swap-modal-content">
                            {(step === 'confirm' || step === 'processing') && (
                                <div className="space-y-6">
                                    <div className="swap-modal-heading-container">
                                        <h2 className="swap-modal-youre-swapping">{t("You're swapping")}</h2>
                                    </div>
                                    {/* Swap Details Card */}
                                    <div className="swap-modal-details-new">
                                        {/* From Row */}
                                        <div className="swap-modal-amount-row">
                                            <div className="swap-modal-token-badge">
                                                <div className="swap-modal-token-icon-small">
                                                    {getTokenIcon(fromToken?.symbol) ? (
                                                        <img src={getTokenIcon(fromToken?.symbol)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        fromToken?.symbol?.[0] || '?'
                                                    )}
                                                </div>
                                            </div>
                                            <div className="swap-modal-amount-content">
                                                <div className="swap-modal-amount-label">{t('From')}</div>
                                                <div className="swap-modal-amount-value">
                                                    {formatAmount(frozenData?.fromAmount || fromAmount, frozenData?.fromToken?.symbol || fromToken?.symbol)} {frozenData?.fromToken?.symbol || fromToken?.symbol}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow Separator */}
                                        <div className="swap-modal-arrow-container">
                                            <ArrowDown size={14} className="text-swap-secondary" />
                                        </div>

                                        {/* To Row */}
                                        <div className="swap-modal-amount-row">
                                            <div className="swap-modal-token-badge">
                                                <div className="swap-modal-token-icon-small">
                                                    {getTokenIcon(toToken?.symbol) ? (
                                                        <img src={getTokenIcon(toToken?.symbol)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        toToken?.symbol?.[0] || '?'
                                                    )}
                                                </div>
                                            </div>
                                            <div className="swap-modal-amount-content">
                                                <div className="swap-modal-amount-label">{t('To (Estimated)')}</div>
                                                <div className="swap-modal-amount-value">
                                                    {formatAmount(frozenData?.toAmount || toAmount, frozenData?.toToken?.symbol || toToken?.symbol)} {frozenData?.toToken?.symbol || toToken?.symbol}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction Steps Progress */}
                                    <div className="swap-modal-steps">
                                        {/* Only show approval step if approval is needed */}
                                        {(needsApproval && !approveSuccess) && (
                                            <>
                                                <div className={`swap-modal-step ${approveSuccess ? 'completed' : 'active'}`}>
                                                    <div className="swap-modal-step-icon">
                                                        {approveSuccess ? <Check size={16} /> : isApproving ? <Loader className="animate-spin" size={16} /> : <div className="swap-modal-step-number">1</div>}
                                                    </div>
                                                    <div className="swap-modal-step-content">
                                                        <p className="swap-modal-step-title">{t('Approve in Wallet')}</p>
                                                        <p className="swap-modal-step-desc">{t('Allow Stac to use your')} {fromToken?.symbol}</p>
                                                    </div>
                                                </div>

                                                <div className="swap-modal-step-line" />

                                                <div className="swap-modal-step pending">
                                                    <div className="swap-modal-step-icon">
                                                        <div className="swap-modal-step-number">2</div>
                                                    </div>
                                                    <div className="swap-modal-step-content">
                                                        <p className="swap-modal-step-title">{t('Swap in Wallet')}</p>
                                                        <p className="swap-modal-step-desc">{t('Execute the swap transaction')}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Show swap step active after approval is successful */}
                                        {(needsApproval && approveSuccess) && (
                                            <>
                                                <div className="swap-modal-step completed">
                                                    <div className="swap-modal-step-icon">
                                                        <Check size={16} />
                                                    </div>
                                                    <div className="swap-modal-step-content">
                                                        <p className="swap-modal-step-title">{t('Approve in Wallet')}</p>
                                                        <p className="swap-modal-step-desc">{t('Allow Stac to use your')} {fromToken?.symbol}</p>
                                                    </div>
                                                </div>

                                                <div className="swap-modal-step-line" />

                                                <div className={`swap-modal-step ${step === 'success' ? 'completed' : 'active'}`}>
                                                    <div className="swap-modal-step-icon">
                                                        {step === 'success' ? <Check size={16} /> : isSwapping ? <Loader className="animate-spin" size={16} /> : <div className="swap-modal-step-number">2</div>}
                                                    </div>
                                                    <div className="swap-modal-step-content">
                                                        <p className="swap-modal-step-title">{t('Swap in Wallet')}</p>
                                                        <p className="swap-modal-step-desc">{t('Execute the swap transaction')}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* When no approval needed, show only the swap step */}
                                        {!needsApproval && (
                                            <div className={`swap-modal-step ${step === 'success' ? 'completed' : 'active'}`}>
                                                <div className="swap-modal-step-icon">
                                                    {step === 'success' ? <Check size={16} /> : isSwapping ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                                                </div>
                                                <div className="swap-modal-step-content">
                                                    <p className="swap-modal-step-title">{t('Swap in Wallet')}</p>
                                                    <p className="swap-modal-step-desc">{t('Execute the swap transaction')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {step === 'confirm' && (
                                        <button
                                            onClick={needsApproval ? handleApprove : handleSwap}
                                            className="swap-modal-action-button"
                                        >
                                            {needsApproval ? `${t('Approve')} ${fromToken?.symbol}` : `${t('Swap')}`}
                                        </button>
                                    )}

                                </div>
                            )}



                            {step === 'success' && (
                                <div className="space-y-6 pt-6 pb-4">
                                    <div className="swap-modal-status-card-new">
                                        <div className="swap-modal-success-icon-wrapper">
                                            <div className="swap-modal-checkmark-circle">
                                                <Check size={32} strokeWidth={3} />
                                            </div>
                                        </div>
                                        <h4 className="swap-modal-status-title-new">{t('Transaction Confirmed!')}</h4>
                                        <div className="swap-modal-success-summary-text">
                                            {t('You swapped')}
                                        </div>
                                        <div className="swap-modal-success-summary-visual">
                                            <div className="swap-modal-success-token-badge">
                                                <img src={getTokenIcon(frozenData?.fromToken?.symbol || fromToken?.symbol)} alt="" className="swap-modal-success-token-img" />
                                                <span>{formatAmount(frozenData?.fromAmount || fromAmount, frozenData?.fromToken?.symbol || fromToken?.symbol)} {frozenData?.fromToken?.symbol || fromToken?.symbol}</span>
                                            </div>
                                            <div className="swap-modal-success-path-arrow">
                                                <ArrowDown size={14} className="rotate-[-90deg]" />
                                            </div>
                                            <div className="swap-modal-success-token-badge">
                                                <img src={getTokenIcon(frozenData?.toToken?.symbol || toToken?.symbol)} alt="" className="swap-modal-success-token-img" />
                                                <span>{formatAmount(frozenData?.toAmount || toAmount, frozenData?.toToken?.symbol || toToken?.symbol)} {frozenData?.toToken?.symbol || toToken?.symbol}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="swap-modal-action-button-secondary-new"
                                    >
                                        {t('Close')}
                                    </button>
                                </div>
                            )}

                            {step === 'error' && (
                                <div className="space-y-6 pt-6 pb-4">
                                    <div className="swap-modal-status-card-new">
                                        <div className="swap-modal-success-icon-wrapper">
                                            <div className="swap-modal-error-circle">
                                                <X size={32} strokeWidth={3} />
                                            </div>
                                        </div>
                                        <h4 className="swap-modal-status-title-new">{t('Swap Failed')}</h4>
                                        <div className="swap-modal-success-summary-text">
                                            {t('Something went wrong')}
                                        </div>
                                        <p className="swap-modal-status-text px-4">
                                            {getCleanErrorMessage(error?.message) || t('The transaction was cancelled or failed on-chain.')}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setStep('confirm')}
                                        className="swap-modal-action-button-secondary-new"
                                    >
                                        {t('Try Again')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SwapModal;