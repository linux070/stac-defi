import { useState } from 'react';
import { ModalContext } from './ModalContext';

export const ModalProvider = ({ children }) => {
    const [isFocusedModalOpen, setIsFocusedModalOpen] = useState(false);

    return (
        <ModalContext.Provider value={{ isFocusedModalOpen, setIsFocusedModalOpen }}>
            {children}
        </ModalContext.Provider>
    );
};
