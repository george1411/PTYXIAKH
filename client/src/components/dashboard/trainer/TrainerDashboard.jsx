import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import TrainerSidebar from './TrainerSidebar';
import TrainerProfile from './TrainerProfile';
import TrainerOverview from './TrainerOverview';
import TrainerClients from './TrainerClients';
import TrainerPrograms from './TrainerPrograms';
import TrainerGroups from './TrainerGroups';
import Schedule from '../common/widgets/Schedule/Schedule';
import Settings from '../common/Settings/Settings';
import { Search, Bell, User } from 'lucide-react';
import useIsMobile from '../../../hooks/useIsMobile';

const NAV_TABS = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'clients',   label: 'Clients'   },
    { id: 'groups',    label: 'Groups'    },
    { id: 'programs',  label: 'Programs'  },
    { id: 'schedule',  label: 'Schedule'  },
    { id: 'profile',   label: 'Profile'   },
];

// ─── Notification Bell ────────────────────────────────────────
const NotificationBell = ({ onNavigateToMessages, onNavigateToClient }) => {
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
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                onClick={() => setOpen(prev => !prev)}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: '#e0e0e0', color: '#000' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-9 w-80 rounded-2xl shadow-xl z-50 overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-sm font-semibold" style={{ color: '#f0f0f0' }}>Messages</span>
                        {unreadCount === 0
                            ? <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>All caught up</span>
                            : <span className="text-xs font-semibold" style={{ color: '#e0e0e0' }}>{unreadCount} unread</span>
                        }
                    </div>

                    {convos.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No conversations yet</div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto">
                            {convos.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                    onClick={() => { setOpen(false); onNavigateToClient(c.id); }}
                                >
                                    <div className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)', color: '#e0e0e0' }}>
                                        {c.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold truncate" style={{ color: '#f0f0f0' }}>{c.name}</span>
                                            <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(c.lastAt)}</span>
                                        </div>
                                        <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {c.lastMessage?.startsWith('__WORKOUT__') ? 'Sent a workout program' : (c.lastMessage || '—')}
                                        </p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0 mt-0.5" style={{ background: '#e0e0e0', color: '#000' }}>
                                            {c.unread}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            className="w-full text-xs font-semibold text-center hover:underline"
                            style={{ color: '#e0e0e0' }}
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
    const [activeTab, setActiveTab]           = useState('overview');
    const [targetClientId, setTargetClientId] = useState(null);
    const [targetClientTab, setTargetClientTab] = useState(null);
    const [targetProgramId, setTargetProgramId] = useState(null);
    const isMobile = useIsMobile();

    // ── Global search ──────────────────────────────────────────
    const [searchQuery, setSearchQuery]   = useState('');
    const [searchOpen, setSearchOpen]     = useState(false);
    const [searchData, setSearchData]     = useState({ clients: [], programs: [] });
    const [searchLoaded, setSearchLoaded] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadSearchData = async () => {
        if (searchLoaded) return;
        try {
            const [cr, pr] = await Promise.all([
                axios.get('/api/v1/trainer/clients', { withCredentials: true }),
                axios.get('/api/v1/trainer/templates', { withCredentials: true }),
            ]);
            setSearchData({ clients: cr.data.data || [], programs: pr.data.data || [] });
            setSearchLoaded(true);
        } catch {}
    };

    const searchResults = (() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        return {
            clients:  searchData.clients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 5),
            programs: searchData.programs.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5),
        };
    })();

    const hasResults = searchResults && (searchResults.clients.length > 0 || searchResults.programs.length > 0);

    const navigateToClient = (clientId) => {
        setTargetClientId(clientId);
        setTargetClientTab(null);
        setActiveTab('clients');
    };

    const navigateToClientMessages = (clientId) => {
        setTargetClientId(clientId);
        setTargetClientTab('messages');
        setActiveTab('clients');
    };

    const navigateToProgram = (programId) => {
        setTargetProgramId(programId);
        setActiveTab('programs');
    };

    return (
        <div className="flex flex-col min-h-screen font-sans overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #0f0f14 0%, #000000 100%)', color: '#f0f0f0' }}>
            {/* Bottom nav on mobile */}
            {isMobile && (
                <TrainerSidebar activeTab={activeTab} onNavigate={setActiveTab} onLogout={onLogout} user={user} />
            )}

            {/* Header */}
            <header className="shrink-0 sticky top-0 z-40" style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between px-8" style={{ height: 60, position: 'relative' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>
                            Gym<span style={{ color: '#818cf8' }}>Lit</span>
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', lineHeight: 1, marginLeft: 22 }}>Trainer</span>
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
                        <div className="relative hidden md:block" ref={searchRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)', zIndex: 1 }} />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                                onFocus={() => { loadSearchData(); setSearchOpen(true); }}
                                className="rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none transition-colors"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0f0', width: 220 }}
                            />
                            {searchOpen && searchQuery.trim() && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280, background: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.7)', zIndex: 200 }}>
                                    {!hasResults ? (
                                        <div style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>No results for "{searchQuery}"</div>
                                    ) : (
                                        <>
                                            {searchResults.clients.length > 0 && (
                                                <>
                                                    <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Clients</div>
                                                    {searchResults.clients.map(c => (
                                                        <button key={c.id} onClick={() => { navigateToClient(c.id); setSearchOpen(false); setSearchQuery(''); }}
                                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(129,140,248,0.15)', color: '#a5b4fc', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {searchResults.programs.length > 0 && (
                                                <>
                                                    <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderTop: searchResults.clients.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>Programs</div>
                                                    {searchResults.programs.map(p => (
                                                        <button key={p.id} onClick={() => { navigateToProgram(p.id); setSearchOpen(false); setSearchQuery(''); }}
                                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📋</div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.type === 'day' ? '1-Day Program' : 'Weekly Program'}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <NotificationBell
                            onNavigateToMessages={() => setActiveTab('clients')}
                            onNavigateToClient={navigateToClientMessages}
                        />
                    </div>
                </div>
            </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative" style={{ background: 'transparent', paddingBottom: isMobile ? 80 : undefined }}>
                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        {activeTab === 'schedule' ? (
                            <Schedule onNavigate={setActiveTab} fullPage={true} isTrainer={true} />
                        ) : activeTab === 'settings' ? (
                            <Settings user={user} onLogout={onLogout} isTrainer={true} onUserUpdate={onUserUpdate} />
                        ) : activeTab === 'overview' ? (
                            <TrainerOverview user={user} onNavigate={setActiveTab} />
                        ) : activeTab === 'clients' ? (
                            <TrainerClients initialClientId={targetClientId} initialTab={targetClientTab} />
                        ) : activeTab === 'groups' ? (
                            <TrainerGroups user={user} onNavigate={setActiveTab} onNavigateToClient={navigateToClient} />
                        ) : activeTab === 'programs' ? (
                            <TrainerPrograms initialProgramId={targetProgramId} />
                        ) : activeTab === 'profile' ? (
                            <TrainerProfile user={user} onLogout={onLogout} />
                        ) : null}
                    </div>
                </main>
        </div>
    );
};

export default TrainerDashboard;
