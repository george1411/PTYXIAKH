import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Workout from './Workout/Workout';
import Schedule from '../common/widgets/Schedule/Schedule';
import Progress from '../common/widgets/Progress/Progress';
import Nutrition from './Nutrition/Nutrition';
import Settings from '../common/Settings/Settings';
import CustomerMessages from '../common/Messages/CustomerMessages';
import ProgressSnapshot from '../common/widgets/ProgressSnapshot';
import StreaksStats from './widgets/StreaksStats/StreaksStats';
import WeeklyMeasurements from './widgets/WeeklyMeasurements/WeeklyMeasurements';
import TodayNutrition from './widgets/TodayNutrition/TodayNutrition';
import TodayWorkout from './widgets/TodayWorkout/TodayWorkout';
import TodayEvents from './widgets/TodayEvents/TodayEvents';
import TodayMacros from './widgets/TodayMacros/TodayMacros';
import { ConsistencyCalendar } from '../common/widgets/Progress/Progress';
import { Search, Bell, ShieldCheck, X, HeartCrack } from 'lucide-react';

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

const SEV_COLOR = { Low: '#facc15', Mild: '#facc15', Moderate: '#f97316', High: '#f87171' };

const PainBanner = () => {
    const [zones, setZones]       = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [clearing, setClearing] = useState(false);

    const fetchZones = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/users/pain', { withCredentials: true });
            const data = res.data.data || [];
            setZones(data);
            // Auto-open modal every Monday
            if (data.length > 0 && new Date().getDay() === 1) {
                const mondayKey = new Date().toISOString().split('T')[0];
                if (localStorage.getItem('painCheckMonday') !== mondayKey) {
                    setShowModal(true);
                    localStorage.setItem('painCheckMonday', mondayKey);
                }
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => { fetchZones(); }, [fetchZones]);

    const toggle = (id) => setSelected(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
    });

    const handleClearSelected = async () => {
        setClearing(true);
        try {
            for (const id of selected) {
                await axios.delete(`/api/v1/users/pain/${id}`, { withCredentials: true });
            }
            const remaining = zones.filter(z => !selected.has(z.id));
            setZones(remaining);
            setSelected(new Set());
            if (remaining.length === 0) setShowModal(false);
        } catch { /* silent */ }
        setClearing(false);
    };

    if (zones.length === 0) return null;

    const modal = (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setShowModal(false)}>
            <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.9)', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#818cf8', display: 'block', marginBottom: 6 }}>PAIN CHECK-IN</span>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>Which zones feel better?</h2>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Select the zones you're no longer experiencing pain in.</p>
                </div>
                <div style={{ padding: '8px 24px', maxHeight: 240, overflowY: 'auto' }}>
                    {zones.map(z => {
                        const isSel = selected.has(z.id);
                        const color = SEV_COLOR[z.severity] || '#facc15';
                        return (
                            <div key={z.id} onClick={() => toggle(z.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', userSelect: 'none' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSel ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, background: isSel ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                    {isSel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </div>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: color }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e0e0e0', flex: 1, textDecoration: isSel ? 'line-through' : 'none', opacity: isSel ? 0.5 : 1, transition: 'all 0.15s' }}>{z.zone}</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color }}>{z.severity === 'Low' ? 'Mild' : z.severity}</span>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => setShowModal(false)}
                        style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        Still in pain
                    </button>
                    <button onClick={handleClearSelected} disabled={selected.size === 0 || clearing}
                        style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: selected.size > 0 ? '#22c55e' : 'rgba(255,255,255,0.06)', color: selected.size > 0 ? '#000' : 'rgba(255,255,255,0.2)', fontSize: '0.875rem', fontWeight: 700, cursor: selected.size > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                        <ShieldCheck size={14} />
                        {clearing ? 'Clearing…' : selected.size > 0 ? `Pain free (${selected.size})` : 'Select zones'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Persistent top banner */}
            <div style={{ width: '100%', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 20px', gap: 16, flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 600 }}>
                    You have {zones.length} active pain zone{zones.length !== 1 ? 's' : ''}. Are you still experiencing these?
                </span>
                <button onClick={() => { setSelected(new Set()); setShowModal(true); }}
                    style={{ flexShrink: 0, padding: '3px 12px', borderRadius: 6, border: 'none', background: 'transparent', color: '#000', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Pain free?
                </button>
            </div>
            {showModal && modal}
        </>
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
        <div className="flex min-h-screen text-[var(--text)] font-sans overflow-hidden" style={{ background: '#000000' }}>
            {/* Sidebar - Hidden on mobile, fixed on desktop */}
            <div className="hidden lg:flex flex-col p-2 h-screen sticky top-0 shrink-0">
                <Sidebar
                    activeTab={activeTab}
                    onNavigate={navigateTo}
                    onLogout={onLogout}
                    user={user}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden" style={{ background: '#000000' }}>
                <PainBanner />
                {/* Header */}
                <header className="shrink-0" style={{ background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="h-16 flex justify-between items-center px-8">
                        <div className="flex items-center text-sm">
                            <span style={{ color: '#a5b4fc' }}>Dashboard</span>
                            <span className="mx-2 text-gray-700">›</span>
                            <span className="font-semibold capitalize" style={{ color: '#a5b4fc' }}>{activeTab}</span>
                        </div>

                        <div className="flex items-center gap-5">
                            <span className="hidden md:block text-sm font-semibold" style={{ whiteSpace: 'nowrap', color: '#a5b4fc' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="rounded-full py-1.5 pl-10 pr-4 text-sm text-gray-300 focus:outline-none transition-colors w-56 placeholder:text-gray-600"
                                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                            </div>
                            <NotificationBell onNavigateToMessages={() => navigateTo('messages')} />
                        </div>
                    </div>
                </header>

                {/* Scrollable Grid Area */}
                <main className="flex-1 p-6 lg:p-8 custom-scrollbar relative overflow-y-auto" style={{ background: '#000000' }}>


                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        {activeTab === 'workout' ? (
                            <Workout />
                        ) : activeTab === 'schedule' ? (
                            <Schedule onNavigate={setActiveTab} fullPage={true} readOnly={true} />
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
        </div>
    );
};

export default CustomerDashboard;
