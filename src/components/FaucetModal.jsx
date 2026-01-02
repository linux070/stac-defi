import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Loader, CheckCircle, Check, AlertCircle, ExternalLink, Info, Sparkles } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import BatchFaucetABI from '../abis/BatchFaucetABI.json';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../contexts/WalletContext';
import { TOKENS, BATCH_FAUCET_ADDRESS, USDC_ADDRESS, CHAINS } from '../config/constants';
import { getItem, setItem } from '../utils/indexedDB';

const COOLDOWN_HOURS = 0;
const COOLDOWN_MS = 0; // Disabled for testing

const getTokenIcon = (symbol) => {
    if (!symbol) return null;
    const s = symbol.toLowerCase();
    if (s === 'usdc') return '/icons/usdc.png';
    if (s === 'stck') return '/icons/stac.png';
    if (s === 'ball') return '/icons/ball.jpg';
    if (s === 'mtb') return '/icons/MTB.png';
    if (s === 'ecr') return '/icons/ECR.png';
    return null;
};

const TokenStatus = ({ symbol, hash, error, isPending, isWaiting, isSuccess, chainId }) => {
    return (
        <div className="faucet-token-card">
            <div className="faucet-token-info">
                <div className="faucet-token-icon-wrapper">
                    {getTokenIcon(symbol) ? (
                        <img src={getTokenIcon(symbol)} alt={symbol} />
                    ) : (
                        <span className="text-xs font-bold text-gray-400">{symbol[0]}</span>
                    )}
                </div>
                <span className="faucet-token-symbol">{symbol}</span>
            </div>

            <div className="faucet-token-status">
                {isPending || isWaiting ? (
                    <Loader className="animate-spin text-blue-500" size={14} />
                ) : isSuccess ? (
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[#00897B]" />
                    </div>
                ) : error ? (
                    <AlertCircle size={14} className="text-red-500" />
                ) : (
                    <div className="faucet-status-dot" />
                )}
            </div>
        </div>
    );
};

const FaucetModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { balance: nativeBalance, chainId, switchToNetwork } = useWallet();
    const { address: userAddress } = useAccount();
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [networkError, setNetworkError] = useState(false);

    // Single Hook for Batch Claim
    const batchClaim = useWriteContract();
    const batchWait = useWaitForTransactionReceipt({ hash: batchClaim.data });

    // Check network and cooldown on mount and when modal opens
    useEffect(() => {
        const checkNetwork = () => {
            const arcChainId = '0x' + CHAINS.ARC_TESTNET.toString(16);
            if (chainId && chainId !== arcChainId) {
                setNetworkError(true);
            } else {
                setNetworkError(false);
            }
        };

        const checkCooldown = async () => {
            // Disabled for testing
            setCooldownRemaining(0);
        };

        if (isOpen) {
            checkNetwork();
            checkCooldown();
        }
    }, [isOpen, userAddress, chainId]);

    // Timer for countdown
    useEffect(() => {
        let timer;
        if (cooldownRemaining > 0) {
            timer = setInterval(() => {
                setCooldownRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldownRemaining]);

    // Save claim timestamp on success
    useEffect(() => {
        if (batchWait.isSuccess && userAddress) {
            setItem(`faucet_last_claim_${userAddress}`, Date.now());
            // Dispatch event to refresh balances globally
            window.dispatchEvent(new CustomEvent('faucetClaimed'));
            console.log('[Faucet] Claim successful, dispatched refresh event');
        }
    }, [batchWait.isSuccess, userAddress]);

    const handleClaimAll = () => {
        if (!userAddress) return;

        // Ensure on correct network
        const arcChainId = '0x' + CHAINS.ARC_TESTNET.toString(16);
        if (chainId !== arcChainId) {
            switchToNetwork({ chainId: '0x' + CHAINS.ARC_TESTNET.toString(16) });
            return;
        }

        batchClaim.writeContract({
            address: BATCH_FAUCET_ADDRESS,
            abi: BatchFaucetABI,
            functionName: 'claimAll',
            args: [[USDC_ADDRESS, TOKENS.STCK, TOKENS.BALL, TOKENS.MTB, TOKENS.ECR]],
        });
    };

    // Reset state when modal opens to avoid showing previous success
    useEffect(() => {
        if (isOpen && batchClaim.reset) {
            batchClaim.reset();
        }
    }, [isOpen]);

    const formatCooldown = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const isPending = batchClaim.isPending || batchWait.isLoading;
    const isSuccess = batchWait.isSuccess;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="swap-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="swap-modal-container max-w-[460px] w-full mx-4"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="swap-modal-close-button-alt"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                    <div className="swap-modal-content">
                        <div className="swap-modal-heading-container">
                            <h2 className="swap-modal-youre-swapping">
                                {isSuccess ? t('Faucet Success') : t('Multi-Token Faucet')}
                            </h2>
                        </div>

                        {!isSuccess ? (
                            <div className="pt-2">
                                <div className="faucet-notice-card !mb-4">
                                    <Info size={18} className="faucet-notice-icon" />
                                    <p className="faucet-notice-text">
                                        {networkError
                                            ? t('Please switch to Arc Testnet to claim tokens.')
                                            : cooldownRemaining > 0
                                                ? t('Faucet is on cooldown for security. Please wait.')
                                                : parseFloat(nativeBalance) < 5
                                                    ? t('You need at least 5 USDC to claim. Try the Circle faucet first.')
                                                    : t('Claim all tokens in a single transaction.')}
                                    </p>
                                </div>

                                {batchClaim.error && (
                                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                                        <AlertCircle size={16} className="text-red-500 shrink-0" />
                                        <p className="text-xs text-red-500 font-medium leading-tight">
                                            {batchClaim.error.message.includes('User rejected')
                                                ? t('Transaction was rejected.')
                                                : batchClaim.error.message.slice(0, 80) + '...'}
                                        </p>
                                    </div>
                                )}

                                <div className="faucet-tokens-grid !grid-cols-3">
                                    <TokenStatus
                                        symbol="USDC"
                                        hash={batchClaim.data}
                                        isPending={false}
                                        isWaiting={isPending}
                                        isSuccess={isSuccess}
                                        error={batchClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="STCK"
                                        hash={batchClaim.data}
                                        isPending={false}
                                        isWaiting={isPending}
                                        isSuccess={isSuccess}
                                        error={batchClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="BALL"
                                        hash={batchClaim.data}
                                        isPending={false}
                                        isWaiting={isPending}
                                        isSuccess={isSuccess}
                                        error={batchClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="MTB"
                                        hash={batchClaim.data}
                                        isPending={false}
                                        isWaiting={isPending}
                                        isSuccess={isSuccess}
                                        error={batchClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="ECR"
                                        hash={batchClaim.data}
                                        isPending={false}
                                        isWaiting={isPending}
                                        isSuccess={isSuccess}
                                        error={batchClaim.error}
                                        chainId={chainId}
                                    />
                                </div>


                                {/* Circle USDC Faucet Link - Rocks in both light & dark mode */}
                                <div className="faucet-external-card"
                                    onClick={() => window.open('https://faucet.circle.com/', '_blank')}>
                                    <div className="faucet-external-info">
                                        <div className="faucet-external-icon">
                                            <img src="/icons/usdc.png" alt="USDC" />
                                        </div>
                                        <div>
                                            <h5 className="faucet-external-title">{t('Need Official USDC?')}</h5>
                                            <p className="faucet-external-subtitle">{t('Claim on Circle Faucet')}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleClaimAll}
                                    disabled={isPending || !userAddress}
                                    className="swap-modal-action-button w-full"
                                >
                                    {networkError ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{t('Switch to Arc Testnet')}</span>
                                        </div>
                                    ) : isPending ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="animate-spin" size={18} />
                                            <span>{t('Processing...')}</span>
                                        </div>
                                    ) : cooldownRemaining > 0 ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{t('Next claim in')} {formatCooldown(cooldownRemaining)}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Sparkles size={18} />
                                            <span>{t('Claim All Test Tokens')}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 pt-2 pb-4">
                                <div className="swap-modal-status-card-new">
                                    <div className="swap-modal-success-icon-wrapper">
                                        <div className="swap-modal-checkmark-circle">
                                            <Check size={32} strokeWidth={3} />
                                        </div>
                                    </div>
                                    <h4 className="swap-modal-status-title-new">{t('Tokens Claimed!')}</h4>
                                    <div className="swap-modal-success-summary-text">
                                        {t('All test tokens have been sent to your wallet.')}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {['USDC', 'STCK', 'BALL', 'MTB', 'ECR'].map(symbol => (
                                            <div key={symbol} className="swap-modal-success-token-badge border border-white/5 py-2 px-3 bg-white/5 rounded-xl flex items-center justify-center gap-2">
                                                <img src={getTokenIcon(symbol)} alt="" className="w-5 h-5 rounded-full" />
                                                <span className="font-bold text-sm">{symbol}</span>
                                            </div>
                                        ))}
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
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FaucetModal;
