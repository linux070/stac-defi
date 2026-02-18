import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Tab-level ErrorBoundary to catch errors in specific page content
 * without crashing the entire layout (navigation, etc.)
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Tab ErrorBoundary caught an error:", error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl my-8 shadow-sm"
                >
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 mb-6">
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                        {this.props.title || "Unable to load content"}
                    </h3>

                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
                        {this.props.message || "Something went wrong while loading this section. Please try refreshing or check your connection."}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                    >
                        Reload
                    </button>
                </motion.div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
