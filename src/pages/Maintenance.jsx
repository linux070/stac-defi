import React from 'react';
import { Hammer, Wrench, Clock, Twitter, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0B] flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="z-10 text-center max-w-2xl"
            >
                {/* Animated Icon */}
                <motion.div
                    animate={{
                        rotate: [0, 10, 0, -10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="inline-flex p-5 rounded-3xl bg-blue-50 dark:bg-blue-500/10 mb-8 border border-blue-100 dark:border-blue-500/20"
                >
                    <Hammer className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                    Under <span className="text-blue-600 dark:text-blue-400">Maintenance</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                    Stac is currently undergoing some scheduled upgrades to bring you a better DeFi experience.
                    We'll be back online shortly. Thank you for your patience!
                </p>

                {/* Status Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider">Estimated Time</p>
                            <p className="text-slate-900 dark:text-white font-semibold">TBA</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium uppercase tracking-wider">Internal Status</p>
                            <p className="text-slate-900 dark:text-white font-semibold">Upgrading Nodes</p>
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-6">
                    <a
                        href="https://x.com/stac_defi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    >
                        <Twitter className="w-5 h-5" />
                        <span className="font-medium">Stay Updated</span>
                    </a>
                    <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                    <a
                        href="https://github.com/linux070/stac-defi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        <span className="font-medium">GitHub</span>
                    </a>
                </div>
            </motion.div>

            {/* Footer Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-10 left-0 right-0 text-center"
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-6 w-4 overflow-hidden flex-shrink-0 bg-transparent">
                        <img
                            src="/icons/Stac.png"
                            alt=""
                            className="h-6 max-w-none object-cover dark:invert"
                            style={{ objectPosition: 'left' }}
                        />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">Stac</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 Stac Protocol. Built for efficiency.</p>
            </motion.div>
        </div>
    );
};

export default Maintenance;
