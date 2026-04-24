const BackgroundGradient = () => {
    return (
        // Fixed container behind everything
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-white dark:bg-page-dark">
            {/* --- LIGHT MODE BLOOMS --- */}
            <div className="dark:hidden opacity-30">
                <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full filter blur-[100px] opacity-40 animate-blob" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.04)' }}></div>
                <div className="absolute bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full filter blur-[120px] opacity-30 animate-blob animation-delay-2000" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.04)' }}></div>
            </div>

            {/* --- BLOBS (Dark Mode Only) --- */}
            <div className="hidden dark:block opacity-60">
                {/* Primary Brand Blob — subtle purple glow */}
                <div className="absolute top-[-10%] md:top-[-15%] left-[-20%] md:left-[-10%] w-[350px] md:w-[700px] h-[350px] md:h-[700px] rounded-full mix-blend-plus-lighter filter blur-[80px] md:blur-[120px] opacity-20 animate-blob" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.15)' }}></div>

                {/* Secondary Blobs — deep navy tones */}
                <div className="absolute top-[5%] left-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full mix-blend-plus-lighter filter blur-[60px] md:blur-[100px] opacity-15 animate-blob animation-delay-3000" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.08)' }}></div>
                <div className="absolute top-[-5%] md:top-[-10%] right-[0%] md:right-[10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full mix-blend-plus-lighter filter blur-[80px] md:blur-[120px] opacity-15 animate-blob" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.06)' }}></div>
                <div className="absolute bottom-[-10%] md:bottom-[-15%] right-[-10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] rounded-full mix-blend-plus-lighter filter blur-[90px] md:blur-[130px] opacity-15 animate-blob animation-delay-2000" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.05)' }}></div>
                <div className="absolute bottom-[20%] md:bottom-[15%] right-[5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full mix-blend-plus-lighter filter blur-[70px] md:blur-[110px] opacity-15 animate-blob animation-delay-5000" style={{ willChange: 'transform', background: 'rgba(99, 102, 241, 0.06)' }}></div>

                {/* --- CENTER AMBIENT GLOW --- */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full filter blur-[100px] md:blur-[150px] opacity-[0.06] pointer-events-none" style={{ background: 'rgba(99, 102, 241, 0.12)' }}></div>
            </div>

            {/* Subtle Grain Overlay for Modern Feel */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
    );
};

export default BackgroundGradient;
