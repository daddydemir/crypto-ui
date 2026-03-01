import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    const success = (message: string, duration?: number) => showToast(message, 'success', duration);
    const error = (message: string, duration?: number) => showToast(message, 'error', duration);
    const warning = (message: string, duration?: number) => showToast(message, 'warning', duration);
    const info = (message: string, duration?: number) => showToast(message, 'info', duration);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-md",
                bgColors[toast.type]
            )}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-grow text-sm font-medium text-gray-900 dark:text-gray-100">
                {toast.message}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
        </motion.div>
    );
};
