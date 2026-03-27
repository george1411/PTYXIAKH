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
                className="relative transition-colors"
                style={{ color: '#7a6a50' }}
                onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                onMouseLeave={e => e.currentTarget.style.color = '#7a6a50'}
                onClick={() => setOpen(prev => !prev)}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: '#38bdf8', color: '#fff' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-9 w-80 rounded-2xl shadow-xl z-50 overflow-hidden" style={{ background: '#1e293b', border: '1px solid rgba(56,189,248,0.25)' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(56,189,248,0.15)' }}>
                        <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Messages</span>
                        {unreadCount === 0
                            ? <span className="text-xs text-gray-400">All caught up</span>
                            : <span className="text-xs font-semibold" style={{ color: '#38bdf8' }}>{unreadCount} unread</span>
                        }
                    </div>

                    {convos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: 'rgba(241,245,249,0.4)' }}>No conversations yet</div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto">
                            {convos.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.07)'}
                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                    onClick={() => { setOpen(false); onNavigateToMessages(); }}
                                >
                                    <div className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,130,0,0.25)', color: '#ffc100' }}>
                                        {c.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold truncate" style={{ color: '#f1f5f9' }}>{c.name}</span>
                                            <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(241,245,249,0.4)' }}>{formatTime(c.lastAt)}</span>
                                        </div>
                                        <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'rgba(241,245,249,0.55)' }}>{c.lastMessage || '—'}</p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0 mt-0.5" style={{ background: '#38bdf8', color: '#fff' }}>
                                            {c.unread}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(56,189,248,0.15)' }}>
                        <button
                            className="w-full text-xs font-semibold text-center hover:underline"
                            style={{ color: '#38bdf8' }}
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
        <div className="flex min-h-screen font-sans overflow-hidden" style={{ background: '#0f172a', color: '#f1f5f9' }}>
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
                <header className="h-20 flex justify-between items-center px-8 shrink-0" style={{ background: '#0f172a', borderBottom: '1px solid rgba(56,189,248,0.2)' }}>
                    <div className="flex items-center text-sm" style={{ color: 'rgba(241,245,249,0.5)' }}>
                        <span>Trainer</span>
                        <span className="mx-2">›</span>
                        <span className="font-bold capitalize" style={{ color: '#f1f5f9' }}>{activeTab}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(56,189,248,0.5)' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none transition-colors w-64"
                                style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#f1f5f9' }}
                            />
                        </div>
                        <NotificationBell onNavigateToMessages={() => setActiveTab('messages')} />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative" style={{ background: '#0f172a' }}>
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
