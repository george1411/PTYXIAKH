import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronRight, User } from 'lucide-react';

const NavItem = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${active
            ? 'font-semibold'
            : 'hover:bg-white/5'
            }`}
        style={active
            ? { background: 'rgba(255,255,255,0.08)', color: '#f0f0f0' }
            : { color: 'rgba(255,255,255,0.5)' }
        }
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
            style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-xl tracking-wide" style={{ color: '#f0f0f0' }}>GymLit</span>
                </div>
                <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Trainer Panel</div>
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
            <div className="p-4 mt-auto" ref={menuRef} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)', color: '#e0e0e0' }}>
                            {user?.profileImage
                                ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={16} />
                            }
                        </div>
                        <span className="flex-1 text-sm font-semibold text-left truncate" style={{ color: '#f0f0f0' }}>My Account</span>
                        <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.3)', transform: menuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {menuOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-xl overflow-hidden z-50" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f0f0'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            <button
                                onClick={() => { onLogout(); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                                style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
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
