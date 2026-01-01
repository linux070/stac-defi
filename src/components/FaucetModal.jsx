import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Loader, CheckCircle, AlertCircle, ExternalLink, Info, Sparkles } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import TokenABI from '../abis/TokenABI.json';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../contexts/WalletContext';
import { TOKENS } from '../config/constants';

const TokenStatus = ({ symbol, hash, error, isPending, isWaiting, isSuccess, chainId }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isSuccess ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/10 text-blue-400'
                }`}>
                    {symbol[0]}
                </div>
                <span className="text-sm font-bold text-white">{symbol}</span>
            </div>
            
            <div className="flex items-center gap-2">
                {isPending || isWaiting ? (
                    <Loader className="animate-spin text-blue-400" size={14} />
                ) : isSuccess ? (
                    <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <a href={getExplorerUrl(hash, chainId)} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded-lg text-blue-400">
                            <ExternalLink size={10} />
                        </a>
                    </div>
                ) : error ? (
                    <AlertCircle size={14} className="text-red-500" title={error.message} />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
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

        // Trigger all sequential or parallel
        // Parallel is more "one-click"
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
                className="fixed inset-0 z-[100] flex items-center justify-center bridging-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="relative bridging-modal-container max-w-[420px] w-full mx-4 overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-8 text-center bg-gradient-to-b from-blue-600/20 to-transparent border-b border-white/5 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-3xl bg-blue-600/20 flex items-center justify-center mb-4 border border-blue-500/30">
                                <Droplets size={32} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">
                                {t('Multi-Token Faucet')}
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">
                                {t('Get all test assets in one go')}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-[#131720]/80 backdrop-blur-xl">
                        <div className="grid grid-cols-2 gap-3 mb-6">
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

                        {allSuccess ? (
                            <div className="bg-green-500/10 rounded-2xl p-6 text-center border border-green-500/20 mb-4">
                                <Sparkles className="text-green-500 mx-auto mb-3" size={32} />
                                <h4 className="text-white font-bold mb-1">{t('Tokens Claimed!')}</h4>
                                <p className="text-gray-400 text-xs">{t('All test tokens have been sent to your wallet.')}</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleClaimAll}
                                disabled={isAnyPending || !userAddress}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                            >
                                {isAnyPending ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        <span>{t('Processing Claims...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        <span>{t('Claim All Test Tokens')}</span>
                                    </>
                                )}
                            </button>
                        )}

                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-start gap-3">
                            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                {t('You will need to confirm 4 separate transactions in your wallet to claim all tokens.')}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#0d1016] border-t border-white/5">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all text-sm"
                        >
                            {t('Close')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FaucetModal;
