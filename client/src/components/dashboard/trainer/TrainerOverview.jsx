import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    ReferenceLine, LabelList
} from 'recharts';
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

    const clientStats          = data?.clientStats          || [];
    const recentActivity       = data?.recentActivity       || [];
    const todayEvents          = data?.todayEvents          || [];
    const clients              = data?.clients              || [];
    const stats                = data?.stats               || {};
    const clientsWithoutProgram = data?.clientsWithoutProgram || [];

    const workoutData = clientStats.map(c => ({
        name: c.name?.split(' ')[0] || 'Client',
        workouts: c.workoutsThisWeek,
    }));

    const weightData = clientStats
        .filter(c => c.weightStart !== null && c.weightCurrent !== null)
        .map(c => {
            const start = parseFloat(c.weightStart) || 0;
            const current = parseFloat(c.weightCurrent) || 0;
            const change = parseFloat((current - start).toFixed(1));
            const base = Math.min(start, current);
            const diff = Math.abs(change);
            return {
                name: c.name?.split(' ')[0] || 'Client',
                fullName: c.name || 'Client',
                start, current, change,
                base,   // always the lower of the two
                diff,   // absolute difference shown on top
                gained: change > 0,
            };
        });

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

            {/* 2 Client graphs */}
            <div className="to-graphs-row">
                {/* Graph 1 — Workouts done this week */}
                <div className="to-graph-card">
                    <h2 className="to-graph-title">Workouts This Week</h2>
                    {workoutData.length === 0 ? (
                        <div className="to-empty-small">No client data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={workoutData} margin={{ top: 16, right: 16, left: -10, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(148,163,184,0.8)' }} axisLine={{ stroke: 'rgba(56,189,248,0.15)' }} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.7)' }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={v => [`${v} session${v !== 1 ? 's' : ''}`, 'Workouts']} contentStyle={{ background: '#1e293b', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, color: '#f1f5f9' }} />
                                <Bar dataKey="workouts" radius={[6,6,0,0]}>
                                    {workoutData.map((entry, i) => (
                                        <Cell key={i} fill={entry.workouts >= 5 ? '#38bdf8' : entry.workouts >= 3 ? '#818cf8' : entry.workouts >= 1 ? '#6366f1' : '#334155'} />
                                    ))}
                                    <LabelList dataKey="workouts" position="top" style={{ fontSize: 11, fill: '#94a3b8' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Graph 2 — Weight start vs current (stacked) */}
                <div className="to-graph-card">
                    <h2 className="to-graph-title">Weight Progress (kg)</h2>
                    {weightData.length === 0 ? (
                        <div className="to-empty-small">No weight data recorded yet.</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={weightData} margin={{ top: 16, right: 16, left: -10, bottom: 0 }} barCategoryGap="35%">
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(148,163,184,0.8)' }} axisLine={{ stroke: 'rgba(56,189,248,0.15)' }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'rgba(148,163,184,0.7)' }} axisLine={false} tickLine={false} unit="kg" />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(56,189,248,0.06)' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0]?.payload;
                                            return (
                                                <div style={{ background: '#1e293b', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: 12 }}>
                                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{d.fullName}</div>
                                                    <div style={{ color: '#38bdf8' }}>Current: {d.current} kg</div>
                                                    <div style={{ color: '#94a3b8' }}>Starting: {d.start} kg</div>
                                                </div>
                                            );
                                        }}
                                    />
                                    {/* base = the lower weight (cyan) */}
                                    <Bar dataKey="base" stackId="w" fill="#38bdf8" radius={[0,0,0,0]} />
                                    {/* diff = the change amount, colored green (loss) or red (gain) */}
                                    <Bar dataKey="diff" stackId="w" radius={[4,4,0,0]}
                                        shape={(props) => {
                                            const { x, y, width, height, index } = props;
                                            const d = weightData[index];
                                            const color = d.gained ? '#f87171' : '#4ade80';
                                            return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} ry={4} />;
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="to-client-last-active">
                                {weightData.map((c, i) => (
                                    <div key={i} className="to-last-active-row">
                                        <span className="to-last-active-name">{c.fullName}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.change < 0 ? '#4ade80' : c.change > 0 ? '#f87171' : '#94a3b8' }}>
                                            {c.change > 0 ? '+' : ''}{c.change} kg
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
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
                        <button className="to-card-link" onClick={() => onNavigate('messages')}>All Messages</button>
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
                                                        ? <span style={{ color: weightChange < 0 ? '#4ade80' : weightChange > 0 ? '#f87171' : '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
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
