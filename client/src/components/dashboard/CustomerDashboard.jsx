import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Workout from './Workout/Workout';
import Schedule from './widgets/Schedule/Schedule';
import Progress from './widgets/Progress/Progress';
import Nutrition from './Nutrition/Nutrition';
import Settings from './Settings/Settings';
import CustomerMessages from './Messages/CustomerMessages';
import ProgressSnapshot from './widgets/ProgressSnapshot';
import StreaksStats from './widgets/StreaksStats/StreaksStats';
import WeeklyMeasurements from './widgets/WeeklyMeasurements/WeeklyMeasurements';
import TodayNutrition from './widgets/TodayNutrition/TodayNutrition';
import TodayWorkout from './widgets/TodayWorkout/TodayWorkout';
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

const CustomerDashboard = ({ user, onLogout, onUserUpdate }) => {
    const [activeTab, setActiveTab]           = useState('overview');
    const [messageTarget, setMessageTarget]   = useState(null); // { id, name }

    const navigateTo = (tab) => setActiveTab(tab);

    const handleMessageTrainer = (id, name) => {
        setMessageTarget({ id, name });
        setActiveTab('messages');
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans overflow-hidden">
            {/* Sidebar - Hidden on mobile, fixed on desktop */}
            <div className="hidden lg:block h-screen sticky top-0">
                <Sidebar
                    activeTab={activeTab}
                    onNavigate={navigateTo}
                    onLogout={onLogout}
                    user={user}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
                    <div className="h-20 flex justify-between items-center px-8">
                        <div className="flex items-center text-sm text-gray-500">
                            <span>Dashboard</span>
                            <span className="mx-2">›</span>
                            <span className="text-[var(--text)] font-bold capitalize">{activeTab}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-[var(--bg)] border border-[var(--border)] rounded-full py-2 pl-10 pr-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors w-64 placeholder:text-[var(--text-muted)]"
                                />
                            </div>
                            <NotificationBell onNavigateToMessages={() => navigateTo('messages')} />
                            <div className="md:hidden w-8 h-8 rounded-full bg-gray-200"></div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Grid Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-[var(--bg)] relative">


                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        {activeTab === 'workout' ? (
                            <Workout />
                        ) : activeTab === 'schedule' ? (
                            <Schedule onNavigate={setActiveTab} fullPage={true} />
                        ) : activeTab === 'progress' ? (
                            <Progress />
                        ) : activeTab === 'nutrition' ? (
                            <Nutrition />
                        ) : activeTab === 'settings' ? (
                            <Settings user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
                        ) : activeTab === 'messages' ? (
                            <CustomerMessages user={user} targetTrainer={messageTarget} />
                        ) : (
                            /* Overview Grid */
                            <div className="grid grid-cols-4 gap-4">
                                {/* Row 4: Weekly Schedule */}
                                <div className="col-span-4">
                                    <Schedule onNavigate={setActiveTab} hideTitle />
                                </div>


                                {/* Row 1: Streaks & Stats | Today's Nutrition */}
                                <div className="col-span-2"><StreaksStats /></div>
                                <div className="col-span-2"><TodayNutrition /></div>

                                {/* Row 3: Today's Workout | Weight Progress */}
                                <div className="col-span-2"><TodayWorkout onNavigate={navigateTo} /></div>
                                <div className="col-span-2"><WeeklyMeasurements /></div>


                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerDashboard;
