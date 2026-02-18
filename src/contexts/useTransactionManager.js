import { useContext } from 'react';
import TransactionContext from './transactionContextDef';

export const useTransactionManager = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactionManager must be used within a TransactionProvider');
    }
    return context;
};
