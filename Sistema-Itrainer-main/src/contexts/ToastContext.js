import React, { createContext, useContext, useState } from 'react';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success', duration) => {
        const id = Date.now() + Math.random();
        // Duracao default por tipo: erros ficam mais tempo (usuario precisa ler).
        const defaultDuration = type === 'error' ? 7000
            : type === 'info' ? 5000
            : 3500;
        const newToast = { id, message, type, duration: duration ?? defaultDuration };
        setToasts(prev => [...prev, newToast]);
        return id;
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};



