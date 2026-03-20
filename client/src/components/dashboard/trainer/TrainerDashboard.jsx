import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import TrainerSidebar from './TrainerSidebar';
import TrainerProfile from './TrainerProfile';
import TrainerOverview from './TrainerOverview';
import TrainerClients from './TrainerClients';
import Schedule from '../widgets/Schedule/Schedule';
import Settings from '../Settings/Settings';
import CustomerMessages from '../Messages/CustomerMessages';
import { Search, Bell } from 'lucide-react';

// ─── Notification Bell ────────────────────────────────────────
const NotificationBell = ({ onNavigateToMessages }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [convos, setConvos]           = useState([]);
    const [open, setOpen]               = useState(false);
    const pollRef                       = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [unreadRes, convosRes] = await Promise.all([
                axios.get('/api/v1/chat/unread', { withCredentials: true }),
                axios.get('/api/v1/chat/conversations', { withCredentials: true }),
            ]);
            setUnreadCount(unreadRes.data.count || 0);
            setConvos(convosRes.data.data || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchData();
        pollRef.current = setInterval(fetchData, 10000);
        return () => clearInterval(pollRef.current);
    }, [fetchData]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
        if (diff < 1)  return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        const hrs = Math.floor(diff / 60);
        if (hrs < 24)  return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="relative">
            <button
                className="relative text-gray-400 hover:text-black transition-colors"
                onClick={() => setOpen(prev => !prev)}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-9 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Messages</span>
                        {unreadCount === 0
                            ? <span className="text-xs text-gray-400">All caught up</span>
                            : <span className="text-xs font-semibold text-red-500">{unreadCount} unread</span>
                        }
                    </div>

                    {convos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No conversations yet</div>
                    ) : (
                        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                            {convos.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => { setOpen(false); onNavigateToMessages(); }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {c.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-800 truncate">{c.name}</span>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(c.lastAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{c.lastMessage || '—'}</p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0 mt-0.5">
                                            {c.unread}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="px-4 py-2.5 border-t border-gray-100">
                        <button
                            className="w-full text-xs font-semibold text-black hover:underline text-center"
                            onClick={() => { setOpen(false); onNavigateToMessages(); }}
                        >
                            Open Messages →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrainerDashboard = ({ user, onLogout, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="flex min-h-screen bg-white text-black font-sans overflow-hidden">
            {/* Sidebar */}
            <div className="hidden lg:block h-screen sticky top-0">
                <TrainerSidebar
                    activeTab={activeTab}
                    onNavigate={setActiveTab}
                    onLogout={onLogout}
                    user={user}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-gray-200 flex justify-between items-center px-8 bg-white shrink-0">
                    <div className="flex items-center text-sm text-gray-500">
                        <span>Trainer</span>
                        <span className="mx-2">›</span>
                        <span className="text-black font-bold capitalize">{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-gray-100 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm text-black focus:outline-none focus:border-black transition-colors w-64 placeholder:text-gray-500"
                            />
                        </div>
                        <NotificationBell onNavigateToMessages={() => setActiveTab('messages')} />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-white relative">
                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        {activeTab === 'schedule' ? (
                            <Schedule onNavigate={setActiveTab} fullPage={true} />
                        ) : activeTab === 'settings' ? (
                            <Settings user={user} onLogout={onLogout} isTrainer={true} onUserUpdate={onUserUpdate} />
                        ) : activeTab === 'overview' ? (
                            <TrainerOverview user={user} onNavigate={setActiveTab} />
                        ) : activeTab === 'clients' ? (
                            <TrainerClients />
                        ) : activeTab === 'profile' ? (
                            <TrainerProfile user={user} />
                        ) : activeTab === 'messages' ? (
                            <CustomerMessages user={user} />
                        ) : null}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TrainerDashboard;
