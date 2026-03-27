import React, { useState, useRef, useEffect } from 'react';
import {
    Home, Dumbbell, UtensilsCrossed, CalendarDays,
    TrendingUp, MessageSquare,
    Settings, LogOut, ChevronRight, User
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'overview',   label: 'Home',      Icon: Home },
    { id: 'workout',    label: 'Workout',   Icon: Dumbbell },
    { id: 'nutrition',  label: 'Nutrition', Icon: UtensilsCrossed },
    { id: 'schedule',   label: 'Schedule',  Icon: CalendarDays },
    { id: 'progress',   label: 'Progress',  Icon: TrendingUp },
    { id: 'messages',   label: 'Messages',  Icon: MessageSquare },
];

const NavItem = ({ label, Icon, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
            active ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
    >
        <Icon size={18} style={{ color: active ? '#a5b4fc' : '#4b5563' }} className="group-hover:text-sky-400 transition-colors" />
        <span className="text-sm font-medium transition-colors" style={{ color: active ? '#a5b4fc' : '#6b7280' }}>{label}</span>
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
        <div className="w-64 h-screen flex flex-col flex-shrink-0 sticky top-0 font-sans" style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Logo */}
            <div className="px-6 pt-7 pb-6">
                <span className="font-black text-xl tracking-tight text-white">
                    Gym<span style={{ color: '#818cf8' }}>Lit</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.id}
                        label={item.label}
                        Icon={item.Icon}
                        active={activeTab === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>

            {/* My Account */}
            <div className="p-3 mt-auto" ref={menuRef}>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-150 group"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: '#2a2a2a', color: '#aaa' }}>
                            {user?.profileImage
                                ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={15} />
                            }
                        </div>
                        <span className="flex-1 text-sm font-semibold text-gray-400 text-left truncate">My Account</span>
                        <ChevronRight
                            size={14}
                            className="text-gray-600 transition-transform duration-200"
                            style={{ transform: menuOpen ? 'rotate(90deg)' : 'none' }}
                        />
                    </button>

                    {menuOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-lg overflow-hidden z-50" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <Settings size={15} />
                                Settings
                            </button>
                            <button
                                onClick={() => { onLogout(); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <LogOut size={15} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
