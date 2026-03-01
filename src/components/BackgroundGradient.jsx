const BackgroundGradient = () => {
    return (
        // Fixed container behind everything
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-white dark:bg-black">
            {/* --- BLOBS (Dark Mode Only) --- */}
            <div className="hidden dark:block">
                {/* Primary Blob */}
                <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] bg-white rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-70 md:animate-blob" style={{ willChange: 'transform' }}></div>

                {/* Secondary Blobs */}
                <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-slate-800/30 rounded-full mix-blend-plus-lighter filter blur-[100px] opacity-20 md:animate-blob animation-delay-3000" style={{ willChange: 'transform' }}></div>
                <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-slate-800/20 rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-20 md:animate-blob" style={{ willChange: 'transform' }}></div>
                <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] bg-slate-900/40 rounded-full mix-blend-plus-lighter filter blur-[130px] opacity-20 md:animate-blob animation-delay-2000" style={{ willChange: 'transform' }}></div>
                <div className="absolute bottom-[15%] right-[5%] w-[600px] h-[600px] bg-slate-800/25 rounded-full mix-blend-plus-lighter filter blur-[110px] opacity-20 md:animate-blob animation-delay-5000" style={{ willChange: 'transform' }}></div>

                {/* --- CENTER AMBIENT GLOW --- */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white filter blur-[150px] opacity-30 pointer-events-none"></div>
            </div>

            {/* Subtle Grain Overlay for Modern Feel */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
};

export default BackgroundGradient;
