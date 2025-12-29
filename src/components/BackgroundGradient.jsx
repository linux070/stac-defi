import React from 'react';

const BackgroundGradient = () => {
    return (
        // Fixed container behind everything
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gray-50 dark:bg-gray-900">

            {/* Blob 1: Arc Purple (Top Left) */}
            <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-purple-400/50 dark:bg-purple-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>

            {/* Blob 2: USDC Blue (Top Right) */}
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-blue-400/50 dark:bg-blue-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>

            {/* Blob 3: Accent Indigo (Bottom Center/Left) */}
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-400/50 dark:bg-indigo-500/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>

        </div>
    );
};

export default BackgroundGradient;
