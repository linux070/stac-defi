import { Component } from 'react';
import { RefreshCw, AlertOctagon, Home } from 'lucide-react';

/**
 * GlobalErrorBoundary catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
class GlobalErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("GlobalErrorBoundary caught an error", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    handleRestart = () => {
        // Full page reload to clear memory and state
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Premium error UI matching the app's aesthetic
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-[#060606] flex items-center justify-center p-4 font-['Inter','Satoshi','General_Sans',sans-serif]">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
                    </div>

                    <div className="relative z-10 w-full max-w-xl bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 shadow-lg shadow-red-500/10">
                                <AlertOctagon size={40} strokeWidth={2} />
                            </div>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            Something went wrong
                        </h1>

                        <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                            The application encountered an unexpected error. We&apos;ve been notified and are working on a fix. In the meantime, you can try refreshing the page.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleRestart}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 active:scale-95 group"
                            >
                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                Refresh Application
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl font-semibold transition-all active:scale-95"
                            >
                                <Home size={18} />
                                Return to Home
                            </button>
                        </div>

                        {import.meta.env?.DEV && this.state.error && (
                            <div className="mt-10 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-left overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                            Error ID: {Math.random().toString(36).substring(2, 9).toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
