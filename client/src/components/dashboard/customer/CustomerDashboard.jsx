import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Workout from './Workout/Workout';
import Schedule from '../common/widgets/Schedule/Schedule';
import Progress from '../common/widgets/Progress/Progress';
import Nutrition from './Nutrition/Nutrition';
import Settings from '../common/Settings/Settings';
import CustomerMessages from '../common/Messages/CustomerMessages';
import CustomerProfile from './CustomerProfile';
import ProgressSnapshot from '../common/widgets/ProgressSnapshot';
import StreaksStats from './widgets/StreaksStats/StreaksStats';
import WeeklyMeasurements from './widgets/WeeklyMeasurements/WeeklyMeasurements';
import TodayNutrition from './widgets/TodayNutrition/TodayNutrition';
import TodayWorkout from './widgets/TodayWorkout/TodayWorkout';
import TodayEvents from './widgets/TodayEvents/TodayEvents';
import TodayMacros from './widgets/TodayMacros/TodayMacros';
import { ConsistencyCalendar } from '../common/widgets/Progress/Progress';
import { StepsWidget, CaloriesWidget } from './widgets/MiniWidgets/MiniWidgets';
import { Search, Bell, User } from 'lucide-react';
import useIsMobile from '../../../hooks/useIsMobile';

const NAV_TABS = [
    { id: 'overview',  label: 'Home'      },
    { id: 'workout',   label: 'Workout'   },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'schedule',  label: 'Schedule'  },
    { id: 'progress',  label: 'Progress'  },
    { id: 'messages',  label: 'Messages'  },
    { id: 'profile',   label: 'Profile'   },
];

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
        <div className="relative flex items-center">
            <button
                className="relative text-gray-500 hover:text-gray-200 transition-colors"
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
                <div className="absolute right-0 top-9 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-sm font-semibold text-gray-200">Messages</span>
                        {unreadCount === 0
                            ? <span className="text-xs text-gray-600">All caught up</span>
                            : <span className="text-xs font-semibold text-red-400">{unreadCount} unread</span>
                        }
                    </div>

                    {convos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-600">No conversations yet</div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {convos.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => { setOpen(false); onNavigateToMessages(); }}
                                >
                                    <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#2a2a2a' }}>
                                        {c.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-300 truncate">{c.name}</span>
                                            <span className="text-[10px] text-gray-600 flex-shrink-0">{formatTime(c.lastAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {c.lastMessage?.startsWith('__WORKOUT__') ? 'Sent a workout program' : (c.lastMessage || '—')}
                                        </p>
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

                    <div className="px-4 py-2.5">
                        <button
                            className="w-full text-xs font-semibold text-gray-400 hover:text-white hover:underline text-center transition-colors"
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
    const isMobile = useIsMobile();

    const navigateTo = (tab) => setActiveTab(tab);

    const handleMessageTrainer = (id, name) => {
        setMessageTarget({ id, name });
        setActiveTab('messages');
    };

    return (
        <div className="flex flex-col min-h-screen text-[var(--text)] font-sans" style={{ background: 'radial-gradient(ellipse at center, #0f0f14 0%, #000000 100%)', overflow: isMobile ? 'visible' : 'hidden' }}>
            {/* Bottom nav on mobile */}
            {isMobile && (
                <Sidebar activeTab={activeTab} onNavigate={navigateTo} onLogout={onLogout} user={user} />
            )}

            {/* Header */}
            <header className="shrink-0 sticky top-0 z-40" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between px-8" style={{ height: 60, position: 'relative' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>
                            Gym<span style={{ color: '#818cf8' }}>Lit</span>
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1, marginLeft: 22 }}>Member</span>
                    </div>

                    {/* Nav tabs — centered, hidden on mobile */}
                    <nav style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 4 }}>
                        {NAV_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '5px 14px 8px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: activeTab === tab.id ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                    fontSize: '0.85rem',
                                    fontWeight: activeTab === tab.id ? 600 : 400,
                                    cursor: 'pointer',
                                    transition: 'color 0.2s',
                                    position: 'relative',
                                }}
                                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                            >
                                {tab.label}
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    height: 2,
                                    width: activeTab === tab.id ? '100%' : '0%',
                                    background: 'rgba(255,255,255,0.9)',
                                    transition: activeTab === tab.id ? 'width 0.35s ease' : 'none',
                                    borderRadius: 1,
                                }} />
                            </button>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-5">
                        <span className="hidden md:block text-sm font-semibold" style={{ whiteSpace: 'nowrap', color: '#ffffff' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none transition-colors w-44"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0f0' }}
                            />
                        </div>
                        <NotificationBell onNavigateToMessages={() => navigateTo('messages')} />
                    </div>
                </div>
            </header>

            {/* Scrollable Grid Area */}
            <main className="flex-1 p-4 lg:p-8 custom-scrollbar relative overflow-y-auto" style={{ background: 'transparent', paddingBottom: isMobile ? 100 : undefined, WebkitOverflowScrolling: 'touch' }}>


                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        {activeTab === 'workout' ? (
                            <Workout />
                        ) : activeTab === 'schedule' ? (
                            <Schedule onNavigate={setActiveTab} fullPage={true} readOnly={true} />
                        ) : activeTab === 'progress' ? (
                            <Progress />
                        ) : activeTab === 'nutrition' ? (
                            <Nutrition userId={user?.id} />
                        ) : activeTab === 'settings' ? (
                            <Settings user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
                        ) : activeTab === 'messages' ? (
                            <CustomerMessages user={user} targetTrainer={messageTarget} />
                        ) : activeTab === 'profile' ? (
                            <CustomerProfile user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />
                        ) : isMobile ? (
                            /* Mobile Overview — single column stack */
                            <div className="flex flex-col gap-4">
                                <TodayWorkout onNavigate={navigateTo} />
                                <TodayEvents onNavigate={navigateTo} />
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <StepsWidget />
                                    <CaloriesWidget />
                                </div>
                            </div>
                        ) : (
                            /* Desktop Overview Grid */
                            <div className="grid grid-cols-4 gap-4">
                                {/* Row 1: Weekly Schedule */}
                                <div className="col-span-4">
                                    <Schedule onNavigate={setActiveTab} hideTitle />
                                </div>

                                {/* Row 2: Today's Workout | Today's Events | Weight Progress */}
                                <div className="col-span-1"><TodayWorkout onNavigate={navigateTo} /></div>
                                <div className="col-span-1"><TodayEvents onNavigate={navigateTo} /></div>
                                <div className="col-span-2"><WeeklyMeasurements /></div>

                                {/* Row 3: Today's Macros | Workout Consistency */}
                                <div className="col-span-2"><TodayMacros /></div>
                                <div className="col-span-2"><ConsistencyCalendar /></div>
                            </div>
                        )}
                    </div>
                </main>
        </div>
    );
};

export default CustomerDashboard;
