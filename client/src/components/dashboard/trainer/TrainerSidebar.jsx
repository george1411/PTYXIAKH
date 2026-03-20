import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronRight, User } from 'lucide-react';

const NavItem = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${active
            ? 'text-white font-semibold bg-black/20'
            : 'text-white/70 hover:text-white hover:bg-black/10'
            }`}
    >
        <span className={`text-sm ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
    </button>
);

const TrainerSidebar = ({ activeTab = 'overview', onNavigate, onLogout, user }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const navItems = [
        { id: 'overview', label: 'Overview' },
        { id: 'schedule', label: 'Calendar' },
        { id: 'clients', label: 'Clients' },
        { id: 'profile', label: 'My Profile' },
    ];

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="w-64 h-screen flex flex-col flex-shrink-0 sticky top-0 font-sans"
            style={{ background: 'linear-gradient(180deg, #111 0%, #1a1a1a 50%, #222 100%)' }}
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-xl tracking-wide text-white">GymLit</span>
                </div>
                <div className="text-xs text-white/50 uppercase tracking-widest">Trainer Panel</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavItem
                        key={item.id}
                        label={item.label}
                        active={activeTab === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>

            {/* My Account block */}
            <div className="p-4 mt-auto border-t border-white/10" ref={menuRef}>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all duration-200 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {user?.profileImage
                                ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={16} />
                            }
                        </div>
                        <span className="flex-1 text-sm font-semibold text-white text-left truncate">My Account</span>
                        <ChevronRight size={15} className="text-white/50 group-hover:text-white transition-transform duration-200" style={{ transform: menuOpen ? 'rotate(90deg)' : 'none' }} />
                    </button>

                    {menuOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                            <button
                                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            <button
                                onClick={() => { onLogout(); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors border-t border-white/10"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerSidebar;
