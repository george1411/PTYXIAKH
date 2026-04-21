import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './TrainerOverview.css';

const TrainerOverview = ({ user, onNavigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
    const growthData = (() => {
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

    const chartTooltipStyle = { background: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f0f0f0', fontSize: 12 };

    return (
        <div className="to-container">
            {/* Welcome */}
            <div className="to-welcome">
                <h1 className="to-welcome-title">
                    Welcome back, {user?.name?.split(' ')[0] || 'Coach'}
                </h1>
                <p className="to-welcome-sub">
                    {stats.totalClients || 0} client{stats.totalClients !== 1 ? 's' : ''} · {stats.todaySessions || 0} sessions today
                </p>
            </div>

            {/* 2 Growth graphs */}
            <div className="to-graphs-row">
                {/* Graph 1 — Business Growth */}
                <div className="to-graph-card">
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 className="to-graph-title" style={{ margin: 0 }}>Business Growth</h2>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Past 12 months</span>
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
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} interval={2} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={chartTooltipStyle}
                                formatter={v => [v, 'Clients']}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                                cursor={false}
                            />
                            <Area type="monotone" dataKey="clients" stroke="#818CF8" strokeWidth={2} fill="url(#growthGrad)" dot={false} activeDot={{ r: 4, fill: '#818CF8' }} />
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
                            <Tooltip
                                contentStyle={chartTooltipStyle}
                                formatter={v => [v, 'Workout days']}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                                cursor={false}
                            />
                            <Area type="monotone" dataKey="workouts" stroke="#818CF8" strokeWidth={2} fill="url(#weeklyGrad)" dot={false} activeDot={{ r: 4, fill: '#818CF8' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Main Grid — Today's Schedule + Recent Activity + Clients */}
            <div className="to-main-grid">
                {/* Today's Schedule */}
                <div className="to-card">
                    <div className="to-card-header">
                        <h2 className="to-card-title">Today's Schedule</h2>
                        <button className="to-card-link" onClick={() => onNavigate('schedule')}>View Calendar</button>
                    </div>
                    {todayEvents.length > 0 ? (
                        <div className="to-events-list">
                            {todayEvents.map((event, i) => (
                                <div key={i} className="to-event-block">
                                    <div className="to-event-block-time">{event.startTime} – {event.endTime}</div>
                                    <div className="to-event-block-title">{event.title}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="to-empty">
                            <p>No sessions scheduled for today</p>
                            <button className="to-empty-btn" onClick={() => onNavigate('schedule')}>Add a session</button>
                        </div>
                    )}
                </div>

                {/* Recent Messages + Pending Programs */}
                <div className="to-card">
                    <div className="to-card-header">
                        <h2 className="to-card-title">Recent Messages</h2>
                        <button className="to-card-link" onClick={() => onNavigate('clients')}>All Messages</button>
                    </div>

                    {/* Pending program alerts */}
                    {clientsWithoutProgram.length > 0 && (
                        <div className="to-pending-section">
                            {clientsWithoutProgram.map((c, i) => (
                                <div key={i} className="to-pending-item" onClick={() => onNavigate('clients')}>
                                    <div className="to-pending-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                                    <div className="to-activity-info">
                                        <span className="to-activity-name">{c.name}</span>
                                        <span className="to-pending-label">No program assigned</span>
                                    </div>
                                    <span className="to-pending-badge">Pending</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {recentActivity.length > 0 ? (
                        <div className="to-activity-list">
                            {recentActivity.map((item, i) => (
                                <div key={i} className="to-activity-item">
                                    <div className="to-activity-avatar to-avatar-client">
                                        {item.from?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="to-activity-info">
                                        <span className="to-activity-name">{item.from}</span>
                                        <span className="to-activity-msg">{item.content}</span>
                                    </div>
                                    <span className="to-activity-time">{formatTime(item.time)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        clientsWithoutProgram.length === 0 && <div className="to-empty"><p>No recent messages</p></div>
                    )}
                </div>

                {/* Clients Table */}
                <div className="to-card to-card-clients">
                    <div className="to-card-header">
                        <h2 className="to-card-title">Your Clients</h2>
                        <button className="to-card-link" onClick={() => onNavigate('clients')}>View All</button>
                    </div>
                    {clientStats.length > 0 ? (
                        <div className="to-ct-wrap">
                            <table className="to-ct-table">
                                <thead>
                                    <tr>
                                        <th className="to-ct-th">Client</th>
                                        <th className="to-ct-th to-ct-center">Today's Workout</th>
                                        <th className="to-ct-th to-ct-center">Protein Today</th>
                                        <th className="to-ct-th to-ct-center">Workouts / Week</th>
                                        <th className="to-ct-th to-ct-center">Weight Change</th>
                                        <th className="to-ct-th to-ct-right">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientStats.map((c, i) => {
                                        const weightChange = (c.weightStart !== null && c.weightCurrent !== null)
                                            ? parseFloat((c.weightCurrent - c.weightStart).toFixed(1))
                                            : null;
                                        const proteinPct = Math.min(100, Math.round((c.proteinConsumed / c.proteinTarget) * 100));
                                        return (
                                            <tr key={i} className="to-ct-row">
                                                <td className="to-ct-td">
                                                    <div className="to-ct-name-cell">
                                                        {c.profileImage
                                                            ? <img src={c.profileImage} alt={c.name} className="to-client-avatar to-ct-avatar to-ct-avatar-img" />
                                                            : <div className="to-client-avatar to-ct-avatar">{c.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                                        }
                                                        <span className="to-ct-name">{c.name}</span>
                                                    </div>
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    {c.todayWorkoutDone
                                                        ? <span className="to-ct-badge to-ct-done">Done</span>
                                                        : <span className="to-ct-badge to-ct-pending">Not Done</span>
                                                    }
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    <div className="to-ct-protein">
                                                        <span className="to-ct-protein-text">{c.proteinConsumed}g / {c.proteinTarget}g</span>
                                                        <div className="to-ct-protein-bar">
                                                            <div className="to-ct-protein-fill" style={{ width: `${proteinPct}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="to-ct-td to-ct-center">
                                                    <span className="to-ct-workouts">{c.workoutsThisWeek}</span>
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
