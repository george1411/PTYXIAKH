import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronRight, User } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'overview',  label: 'Home' },
    { id: 'workout',   label: 'Workout' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'schedule',  label: 'Schedule' },
    { id: 'progress',  label: 'Progress' },
    { id: 'messages',  label: 'Messages' },
];

const NavItem = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '7px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: 8,
            transition: 'color 0.15s',
            color: active ? '#f0f0f0' : 'rgba(255,255,255,0.35)',
            fontWeight: active ? 700 : 400,
            fontSize: '0.9rem',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
    >
        {label}
    </button>
);

const Sidebar = ({ activeTab = 'overview', onNavigate, onLogout, user }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%', background: '#0f0f0f', borderRadius: 12 }}>
            {/* Logo */}
            <div style={{ padding: '28px 20px 24px' }}>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#fff' }}>
                    Gym<span style={{ color: '#818cf8' }}>Lit</span>
                </span>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.id}
                        label={item.label}
                        active={activeTab === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>

            {/* My Account */}
            <div style={{ padding: '12px 8px', marginTop: 'auto' }} ref={menuRef}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2a2a2a', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {user?.profileImage
                                ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={14} />
                            }
                        </div>
                        <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My Account</span>
                        <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)', transform: menuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {menuOpen && (
                        <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, borderRadius: 10, overflow: 'hidden', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50 }}>
                            <button
                                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s, color 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f0f0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                            >
                                <Settings size={14} /> Settings
                            </button>
                            <button
                                onClick={() => { onLogout(); setMenuOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', transition: 'background 0.15s, color 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
