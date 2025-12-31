import React from 'react';

const BackgroundGradient = () => {
    return (
        // Fixed container behind everything
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gray-50 dark:bg-gray-900">

            {/* --- TOP LEFT BLOBS (Cool Tones) --- */}
            {/* Blob 1: Arc Blue (Deep & Soft) */}
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/30 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-60 animate-blob"></div>

            {/* Blob 2: Cyan Accent (Bright & Energetic) */}
            <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-3000"></div>

            {/* --- BOTTOM RIGHT BLOBS (Warm & Deep Tones) --- */}
            {/* Blob 3: Arc Purple (Rich & Immersive) */}
            <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-purple-500/30 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[130px] opacity-60 animate-blob animation-delay-2000"></div>

            {/* Blob 4: Indigo/Violet (Subtle Depth) */}
            <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-violet-600/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[110px] opacity-50 animate-blob animation-delay-5000"></div>

            {/* Subtle Grain Overlay for Modern Feel */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        </div>
    );
};

export default BackgroundGradient;
