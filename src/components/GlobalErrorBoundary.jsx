import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        padding: '40px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '24px',
                        border: '1px solid #333',
                        maxWidth: '500px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>Something went wrong</h1>
                        <p style={{ color: '#888', marginBottom: '24px', lineHeight: '1.6' }}>
                            The application encountered an unexpected error. This has been logged, and we're working to fix it.
                        </p>
                        <div style={{
                            textAlign: 'left',
                            backgroundColor: '#000',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            overflowX: 'auto',
                            marginBottom: '24px',
                            color: '#666'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Refresh Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
