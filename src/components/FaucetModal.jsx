import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Loader, CheckCircle, Check, AlertCircle, ExternalLink, Info, Sparkles } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import TokenABI from '../abis/TokenABI.json';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../contexts/WalletContext';
import { TOKENS } from '../config/constants';

const getTokenIcon = (symbol) => {
    if (!symbol) return null;
    const s = symbol.toLowerCase();
    if (s === 'usdc') return '/icons/usdc.png';
    if (s === 'stck') return '/icons/stac.png';
    if (s === 'ball') return '/icons/ball.jpg';
    if (s === 'mtb') return '/icons/mtb.png';
    if (s === 'ecr') return '/icons/ecr.png';
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
    const { chainId } = useWallet();
    const { address: userAddress } = useAccount();

    // Hooks for STCK
    const stckClaim = useWriteContract();
    const stckWait = useWaitForTransactionReceipt({ hash: stckClaim.data });

    // Hooks for BALL
    const ballClaim = useWriteContract();
    const ballWait = useWaitForTransactionReceipt({ hash: ballClaim.data });

    // Hooks for MTB
    const mtbClaim = useWriteContract();
    const mtbWait = useWaitForTransactionReceipt({ hash: mtbClaim.data });

    // Hooks for ECR
    const ecrClaim = useWriteContract();
    const ecrWait = useWaitForTransactionReceipt({ hash: ecrClaim.data });

    const handleClaimAll = () => {
        if (!userAddress) return;

        const claimToken = (address, claimHook) => {
            claimHook.writeContract({
                address: address,
                abi: TokenABI,
                functionName: 'claimFaucet',
            });
        };

        claimToken(TOKENS.STCK, stckClaim);
        claimToken(TOKENS.BALL, ballClaim);
        claimToken(TOKENS.MTB, mtbClaim);
        claimToken(TOKENS.ECR, ecrClaim);
    };

    const isAnyPending = stckClaim.isPending || stckWait.isLoading ||
        ballClaim.isPending || ballWait.isLoading ||
        mtbClaim.isPending || mtbWait.isLoading ||
        ecrClaim.isPending || ecrWait.isLoading;

    const allSuccess = stckWait.isSuccess && ballWait.isSuccess && mtbWait.isSuccess && ecrWait.isSuccess;

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
                                {allSuccess ? t('Faucet Success') : t('Multi-Token Faucet')}
                            </h2>
                        </div>

                        {!allSuccess ? (
                            <div className="pt-2">
                                <div className="faucet-tokens-grid">
                                    <TokenStatus
                                        symbol="STCK"
                                        hash={stckClaim.data}
                                        isPending={stckClaim.isPending}
                                        isWaiting={stckWait.isLoading}
                                        isSuccess={stckWait.isSuccess}
                                        error={stckClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="BALL"
                                        hash={ballClaim.data}
                                        isPending={ballClaim.isPending}
                                        isWaiting={ballWait.isLoading}
                                        isSuccess={ballWait.isSuccess}
                                        error={ballClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="MTB"
                                        hash={mtbClaim.data}
                                        isPending={mtbClaim.isPending}
                                        isWaiting={mtbWait.isLoading}
                                        isSuccess={mtbWait.isSuccess}
                                        error={mtbClaim.error}
                                        chainId={chainId}
                                    />
                                    <TokenStatus
                                        symbol="ECR"
                                        hash={ecrClaim.data}
                                        isPending={ecrClaim.isPending}
                                        isWaiting={ecrWait.isLoading}
                                        isSuccess={ecrWait.isSuccess}
                                        error={ecrClaim.error}
                                        chainId={chainId}
                                    />
                                </div>

                                <div className="faucet-notice-card">
                                    <Info size={18} className="faucet-notice-icon" />
                                    <p className="faucet-notice-text">
                                        {t('You will need to confirm 4 separate transactions in your wallet to claim all tokens.')}
                                    </p>
                                </div>

                                <button
                                    onClick={handleClaimAll}
                                    disabled={isAnyPending || !userAddress}
                                    className="swap-modal-action-button w-full"
                                >
                                    {isAnyPending ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader className="animate-spin" size={18} />
                                            <span>{t('Claiming...')}</span>
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

                                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                                        {['STCK', 'BALL', 'MTB', 'ECR'].map(symbol => (
                                            <div key={symbol} className="swap-modal-success-token-badge border border-white/5 py-2 px-3 bg-white/5 rounded-xl">
                                                <img src={getTokenIcon(symbol)} alt="" className="swap-modal-success-token-img" />
                                                <span>{symbol}</span>
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
