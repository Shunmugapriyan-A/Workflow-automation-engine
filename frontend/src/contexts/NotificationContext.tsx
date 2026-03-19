import { createContext, useContext, useState, type ReactNode } from 'react';

type Notification = {
    id: string;
    message: string;
    timestamp: Date;
    read: boolean;
};

type NotificationContextType = {
    notifications: Notification[];
    addNotification: (message: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    unreadCount: number;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (message: string) => {
        const newNotif = {
            id: Math.random().toString(36).substring(2, 11),
            message,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Simple toast
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-xl shadow-2xl z-50 animate-fade-in flex items-center gap-3 border border-slate-200 dark:border-slate-700 font-medium text-sm';
        toast.innerHTML = `<span class="bg-violet-500 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></span> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
