import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';

const FeedbackButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Smart Auto-Close: Listen for Tally submission events
    React.useEffect(() => {
        const handleMessage = (e) => {
            if (typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
                // Wait 3 seconds so user can see the "Thanks" message, then auto-close
                setTimeout(() => {
                    setIsOpen(false);
                }, 3000);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <>
            {createPortal(
                <div className="feedback-widget">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="feedback-button"
                    >
                        <MessageSquare size={20} className="mobile-only" />
                        <span className="desktop-only text-sm font-bold">Feedback</span>
                    </button>
                </div>,
                document.body
            )}

            {createPortal(
                <div
                    className={`fixed inset-0 z-[100000] flex items-center justify-center md:items-center md:justify-end p-4 md:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                    {/* Backdrop - High-fidelity blur */}
                    <div
                        className={`absolute inset-0 bg-black/40 backdrop-blur-[12px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar / Modal Container - Forced Light Mode High-End Card */}
                    <div
                        className={`relative w-[92%] max-w-[360px] md:max-w-[480px] h-[85dvh] md:h-full max-h-[700px] md:max-h-[820px] bg-white border border-[#00000015] rounded-[28px] md:rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) ${isOpen ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : 'translate-x-0 md:translate-x-16 translate-y-12 md:translate-y-0 scale-95 opacity-0'}`}
                    >
                        {/* Header - Light Institutional Style */}
                        <div className="flex items-center justify-between p-6 border-b border-[#00000008] bg-gray-50/80">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-[14px] bg-blue-500/10 flex items-center justify-center shadow-inner">
                                    <MessageSquare size={24} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-[17px] tracking-tight leading-none">Feedback</h3>
                                    <p className="text-[10px] font-bold text-gray-400 tracking-[0.05em] uppercase mt-1.5 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                                        Stac Community
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Iframe Content - Pre-loaded for instant speed */}
                        <div className="flex-1 relative w-full bg-white">
                            <iframe
                                src="https://tally.so/embed/7RLbaA?hideTitle=1&transparentBackground=1"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                marginHeight="0"
                                marginWidth="0"
                                style={{ background: 'transparent' }}
                            ></iframe>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default FeedbackButton;
