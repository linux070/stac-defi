import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Clock, AlertTriangle } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#020617] relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 max-w-2xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 p-12 rounded-[2.5rem] shadow-2xl dark:shadow-black/40"
                >
                    {/* Animated Icon Container */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <motion.div
                                animate={{
                                    rotate: [0, -10, 10, -10, 0],
                                    y: [0, -5, 0]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/40"
                            >
                                <Hammer className="text-white" size={48} strokeWidth={1.5} />
                            </motion.div>

                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [1, 0.5, 1]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-[#020617] shadow-lg"
                            >
                                <Clock className="text-white" size={20} strokeWidth={2.5} />
                            </motion.div>
                        </div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
                    >
                        Under <span className="text-blue-600">Maintenance</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium"
                    >
                        We're currently upgrading the Stac experience.
                        <br className="hidden md:block" />
                        Our team is working hard and we'll be back shortly.
                    </motion.p>

                    {/* Status Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10"
                    >
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Live Updates in progress
                        </span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5"
                    >
                        <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">
                            Thank you for your patience during this scheduled downtime.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Maintenance;
