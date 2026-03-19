import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Zap, Bell, Settings, LayoutDashboard, ClipboardList, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotification } from '../contexts/NotificationContext';

export function Layout() {
    const location = useLocation();
    const { notifications, unreadCount, markAsRead } = useNotification();
    const [showNotifications, setShowNotifications] = useState(false);

    const navItems = [
        {
            path: '/',
            label: 'Workflows',
            icon: LayoutDashboard,
            active: location.pathname === '/' || location.pathname.startsWith('/workflows') || location.pathname.startsWith('/executions'),
        },
        {
            path: '/audit',
            label: 'Audit Logs',
            icon: ClipboardList,
            active: location.pathname.startsWith('/audit'),
        },
    ];

    // Build breadcrumb
    const parts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const label = part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return { label, path };
    });

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col transition-colors duration-200">
            {/* ── Top Navbar ── */}
            <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-[0_1px_0_0_rgba(0,0,0,0.4)]">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-14 gap-6">

                        {/* ── Brand ── */}
                        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
                            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-md group-hover:shadow-violet-500/40 transition-shadow duration-300">
                                <Zap className="h-4 w-4 text-white fill-white" />
                                <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-bold text-white text-sm tracking-tight">
                                Workflow <span className="text-violet-500">Engine</span>
                            </span>
                        </Link>

                        {/* ── Divider ── */}
                        <div className="h-5 w-px bg-slate-700 hidden sm:block" />

                        {/* ── Primary Nav ── */}
                        <nav className="flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                        item.active
                                            ? "bg-violet-900/40 text-violet-400 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.3)]"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", item.active ? "text-violet-400" : "text-slate-500")} />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* ── Spacer ── */}
                        <div className="flex-1" />

                        {/* ── Right Actions ── */}
                        <div className="flex items-center gap-2 relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150"
                            >
                                <Bell className="h-4.5 w-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-slate-900" />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                                    <div className="p-3 border-b border-slate-700 font-semibold text-sm text-white flex justify-between items-center bg-slate-800/50">
                                        Notifications
                                        {unreadCount > 0 && <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="text-slate-400 text-xs p-4 text-center">No notifications</p>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => markAsRead(n.id)}
                                                    className={cn("p-3 border-b border-slate-700/50 cursor-pointer transition-colors", !n.read ? "bg-slate-700/30 hover:bg-slate-700/50" : "hover:bg-slate-700/30")}
                                                >
                                                    <div className="flex gap-2">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", !n.read ? "bg-violet-500" : "bg-transparent")} />
                                                        <div>
                                                            <p className={cn("text-xs", !n.read ? "text-slate-200 font-medium" : "text-slate-400")}>{n.message}</p>
                                                            <p className="text-[10px] text-slate-500 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* User section removed */}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Breadcrumb strip (only when nested) ── */}
            {breadcrumbs.length > 0 && (
                <div className="bg-slate-800/50 border-b border-slate-800">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex items-center gap-1 h-9 text-xs text-slate-400">
                            <Link to="/" className="hover:text-slate-200 transition-colors">Home</Link>
                            {breadcrumbs.map((crumb, i) => (
                                <span key={crumb.path} className="flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3 text-slate-600" />
                                    {i === breadcrumbs.length - 1 ? (
                                        <span className="text-slate-200 font-medium capitalize">{crumb.label}</span>
                                    ) : (
                                        <Link to={crumb.path} className="hover:text-slate-200 transition-colors capitalize">{crumb.label}</Link>
                                    )}
                                </span>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Main Container ── */}
            <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="w-full animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
