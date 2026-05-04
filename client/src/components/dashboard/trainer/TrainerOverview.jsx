import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './TrainerOverview.css';

const TrainerOverview = ({ user, onNavigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [growthPeriod, setGrowthPeriod] = useState('year');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get('/api/v1/trainer/dashboard', { withCredentials: true });
                if (res.data.success) setData(res.data.data);
            } catch (err) {
                console.error('Failed to fetch dashboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const formatTime = (dateStr) => {
        if (!dateStr) return 'Never';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        return `${diff}d ago`;
    };

    if (loading) {
        return (
            <div className="to-loading">
                <div className="to-loading-spinner" />
                <p>Loading dashboard…</p>
            </div>
        );
    }

    const clientStats           = data?.clientStats           || [];
    const recentActivity        = data?.recentActivity        || [];
    const todayEvents           = data?.todayEvents           || [];
    const clients               = data?.clients               || [];
    const stats                 = data?.stats                 || {};
    const clientsWithoutProgram = data?.clientsWithoutProgram || [];

    // Build 12-month business growth (cumulative client count)
    const businessGrowthRaw = data?.businessGrowthRaw || [];
    const growthDataYear = (() => {
        const result = [];
        let running = 0;
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            const found = businessGrowthRaw.find(r => r.ym === ym);
            running += found ? parseInt(found.count) : 0;
            result.push({ label, clients: running });
        }
        return result;
    })();
    const growthDataMonth = growthDataYear.slice(-6);
    const growthDataWeek = (() => {
        const base = growthDataYear.slice(-2);
        if (base.length < 2) return base;
        const [prev, curr] = base;
        const step = (curr.clients - prev.clients) / 4;
        return [
            { label: '4w ago', clients: Math.round(prev.clients + step) },
            { label: '3w ago', clients: Math.round(prev.clients + step * 2) },
            { label: '2w ago', clients: Math.round(prev.clients + step * 3) },
            { label: 'This week', clients: curr.clients },
        ];
    })();
    const growthData = growthPeriod === 'week' ? growthDataWeek : growthPeriod === 'month' ? growthDataMonth : growthDataYear;
    const growthPeriodLabel = growthPeriod === 'week' ? 'Past 4 weeks' : growthPeriod === 'month' ? 'Past 6 months' : 'Past 12 months';

    // Build 12-week workout volume
    const weeklyWorkoutsRaw = data?.weeklyWorkoutsRaw || [];
    const weeklyData = (() => {
        const result = [];
        const now = new Date();
        const dow = now.getDay();
        const daysToMonday = dow === 0 ? -6 : 1 - dow;
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() + daysToMonday - i * 7);
            const weekStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const found = weeklyWorkoutsRaw.find(r => r.weekStart === weekStart);
            result.push({ label, workouts: found ? parseInt(found.count) : 0 });
        }
        return result;
    })();

    const avgWorkoutsPerWeek = weeklyData.length
        ? (weeklyData.reduce((s, d) => s + d.workouts, 0) / weeklyData.length).toFixed(1)
        : '0.0';

    const chartTooltipStyle = { background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f0f0', fontSize: 12 };

    const ProteinRing = ({ current, target }) => {
        const pct = Math.min(current / (target || 1), 1);
        const radius = 18, stroke = 3.5;
        const circ = 2 * Math.PI * radius;
        const dash = circ * pct;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <svg width={radius*2+stroke*2} height={radius*2+stroke*2} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                    <circle cx={radius+stroke} cy={radius+stroke} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
                    <circle cx={radius+stroke} cy={radius+stroke} r={radius} fill="none" stroke="#818CF8" strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
                </svg>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>{Math.round(current)}g</div>
                    <div style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>/ {Math.round(target)}g</div>
                </div>
            </div>
        );
    };

    return (
        <div className="to-container">
            {/* Welcome */}
            <div className="to-welcome">
                <h1 className="to-welcome-title">
                    Welcome back.
                </h1>
                <p className="to-welcome-sub">
                    {stats.totalClients || 0} client{stats.totalClients !== 1 ? 's' : ''} · {stats.todaySessions || 0} sessions today
                </p>
            </div>

            {/* 2 Growth graphs */}
            <div className="to-graphs-row">
                {/* Graph 1 — Business Growth */}
                <div className="to-graph-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 className="to-graph-title" style={{ margin: 0 }}>Business Growth</h2>
                        <div className="to-period-toggle">
                            {['week', 'month', 'year'].map(p => (
                                <button
                                    key={p}
                                    className={`to-period-btn ${growthPeriod === p ? 'active' : ''}`}
                                    onClick={() => setGrowthPeriod(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={growthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#818CF8" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} strokeDasharray="0" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
                            <Tooltip content={() => null} cursor={false} />
                            <Area type="monotone" dataKey="clients" stroke="#818CF8" strokeWidth={2} fill="url(#growthGrad)" dot={false} activeDot={false} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Graph 2 — Weekly Workout Volume */}
                <div className="to-graph-card">
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 className="to-graph-title" style={{ margin: 0 }}>Workouts Per Week</h2>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818CF8' }}>
                            {avgWorkoutsPerWeek} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>avg / week</span>
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#818CF8" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} strokeDasharray="0" />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} interval={2} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
                            <Tooltip content={() => null} cursor={false} />
                            <Area type="monotone" dataKey="workouts" stroke="#818CF8" strokeWidth={2} fill="url(#weeklyGrad)" dot={false} activeDot={false} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Main Grid — Today's Schedule + Recent Activity + Clients */}
            <div className="to-main-grid">
                {/* Today's Schedule */}
                <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0' }}>Today's Schedule</div>
                            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {todayEvents.length} session{todayEvents.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <button onClick={() => onNavigate('schedule')} style={{ background: 'transparent', border: 'none', color: '#818CF8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            View Calendar →
                        </button>
                    </div>
                    {todayEvents.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {todayEvents.map((ev, i) => {
                                const EVENT_COLOR_MAP = { 'event-1': '#3d3d5c', 'event-2': '#818CF8', 'event-3': '#38bdf8', 'event-4': '#4ade80', 'event-5': '#f87171' };
                                const accentColor = EVENT_COLOR_MAP[ev.color] || '#818CF8';
                                const clientLabel = ev.clientName || ev.groupName || null;
                                const duration = (() => {
                                    if (!ev.startTime || !ev.endTime) return null;
                                    const [sh, sm] = ev.startTime.split(':').map(Number);
                                    const [eh, em] = ev.endTime.split(':').map(Number);
                                    const mins = (eh * 60 + em) - (sh * 60 + sm);
                                    return mins > 0 ? `${mins} min` : null;
                                })();
                                return (
                                    <div key={i}
                                        style={{ padding: '14px 18px', borderBottom: i < todayEvents.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ width: 3, borderRadius: 2, flexShrink: 0, background: accentColor, opacity: 0.8, alignSelf: 'stretch' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>{ev.startTime} – {ev.endTime}</span>
                                                    {duration && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#555', letterSpacing: '0.03em' }}>{duration}</span>}
                                                </div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.01em', textTransform: 'uppercase', marginBottom: clientLabel ? 4 : 0 }}>{ev.title}</div>
                                                {clientLabel && <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>w/ {clientLabel}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="to-empty">
                            <p>No sessions scheduled for today</p>
                        </div>
                    )}
                </div>

                {/* Recent Messages */}
                <div style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0' }}>Recent Messages</div>
                            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{recentActivity.length} conversation{recentActivity.length !== 1 ? 's' : ''}</div>
                        </div>
                        <button onClick={() => onNavigate('clients')} style={{ background: 'transparent', border: 'none', color: '#818CF8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            All Messages →
                        </button>
                    </div>
                    {recentActivity.length > 0 ? (
                        <div style={{ padding: '8px 8px 10px' }}>
                            {recentActivity.map((item, i) => (
                                <div key={i}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.15s', borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => onNavigate('clients')}>
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', color: '#c4b5fd', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {item.from?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.from}</span>
                                            <span style={{ fontSize: 10, flexShrink: 0, color: '#444', fontWeight: 500 }}>{formatTime(item.time)}</span>
                                        </div>
                                        <span style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', marginTop: 2 }}>
                                            {item.content?.startsWith('__WORKOUT__') ? 'Sent a workout program' : item.content}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="to-empty"><p>No recent messages</p></div>
                    )}
                </div>

                {/* Clients Table */}
                <div className="to-card to-card-clients">
                    <div className="to-card-header">
                        <div>
                            <h2 className="to-card-title" style={{ margin: 0 }}>Your Clients</h2>
                            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{clientStats.length} active</div>
                        </div>
                        <button className="to-card-link" onClick={() => onNavigate('clients')}>View All →</button>
                    </div>
                    {clientStats.length > 0 ? (
                        <div className="to-ct-wrap" style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', padding: 0 }}>
                            <table className="to-ct-table">
                                <thead>
                                    <tr>
                                        {[
                                            { label: 'Client',           align: 'left'   },
                                            { label: "Today's Workout",  align: 'left'   },
                                            { label: 'Protein',          align: 'center' },
                                            { label: 'Workouts / Wk',    align: 'center' },
                                            { label: 'Weight Change',    align: 'center' },
                                            { label: 'Last Active',      align: 'right'  },
                                        ].map((h, i) => (
                                            <th key={i} style={{ padding: '12px 16px', textAlign: h.align, fontSize: 10, fontWeight: 700, letterSpacing: '.10em', color: '#444', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientStats.map((c, i) => {
                                        const weightChange = (c.weightStart !== null && c.weightCurrent !== null)
                                            ? parseFloat((c.weightCurrent - c.weightStart).toFixed(1))
                                            : null;
                                        return (
                                            <tr key={i} className="to-ct-row">
                                                <td className="to-ct-td">
                                                    <div className="to-ct-name-cell">
                                                        {c.profileImage
                                                            ? <img src={c.profileImage} alt={c.name} className="to-client-avatar to-ct-avatar to-ct-avatar-img" />
                                                            : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                                        }
                                                        <span className="to-ct-name">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="to-ct-td">
                                                    {c.todayWorkoutDone ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                            Done
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.20)' }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                            Not Done
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    <ProteinRing current={c.proteinConsumed} target={c.proteinTarget} />
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: c.workoutsThisWeek > 0 ? '#818CF8' : '#333' }}>{c.workoutsThisWeek}</span>
                                                        <div style={{ display: 'flex', gap: 2 }}>
                                                            {Array.from({ length: 7 }).map((_, j) => (
                                                                <div key={j} style={{ width: 5, height: 5, borderRadius: 2, background: j < c.workoutsThisWeek ? '#818CF8' : 'rgba(255,255,255,0.07)' }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    {weightChange !== null
                                                        ? <span style={{ color: weightChange !== 0 ? '#a5b4fc' : '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            {weightChange > 0 ? '+' : ''}{weightChange} kg
                                                          </span>
                                                        : <span className="to-ct-muted">—</span>
                                                    }
                                                </td>
                                                <td className="to-ct-td to-ct-right">
                                                    <span className="to-ct-muted">{formatTime(c.lastActive)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="to-empty">
                            <p>No clients yet</p>
                            <span className="to-empty-sub">Clients appear here once they join with your invite code</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerOverview;
