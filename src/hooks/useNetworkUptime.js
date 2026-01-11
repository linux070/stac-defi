import { useState, useEffect } from 'react';

/**
 * Hook to track network uptime
 * Returns 100% uptime for operational Arc Testnet
 */
export function useNetworkUptime() {
    const [uptime, setUptime] = useState(100);
    const [change, setChange] = useState(null);
    const [trend, setTrend] = useState('stable');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Arc Testnet is operational - 100% uptime
        setUptime(100);
        setChange(null);
        setTrend('stable');
    }, []);

    return { uptime, change, trend, loading };
}

