import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
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

    const complianceData = clientStats.map(c => ({
        name: c.name?.split(' ')[0] || 'Client',
        compliance: c.compliance,
    }));

    const activityData = clientStats.map(c => ({
        name: c.name?.split(' ')[0] || 'Client',
        days: c.activeDays,
        lastActive: c.lastActive,
    }));

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
                {/* Graph 1 — Compliance this week */}
                <div className="to-graph-card">
                    <h2 className="to-graph-title">Client Compliance This Week</h2>
                    {complianceData.length === 0 ? (
                        <div className="to-empty-small">No client data yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={complianceData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={v => [`${v}%`, 'Compliance']} />
                                <Bar dataKey="compliance" radius={[4,4,0,0]}>
                                    {complianceData.map((_, i) => (
                                        <Cell key={i} fill={_ .compliance >= 80 ? '#444' : _.compliance >= 50 ? '#777' : '#bbb'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Graph 2 — Active days this week per client */}
                <div className="to-graph-card">
                    <h2 className="to-graph-title">Active Days This Week</h2>
                    {activityData.length === 0 ? (
                        <div className="to-empty-small">No client data yet.</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={activityData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 7]} ticks={[0,1,2,3,4,5,6,7]} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={v => [`${v} day${v !== 1 ? 's' : ''}`, 'Active']} />
                                    <Bar dataKey="days" fill="#555" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="to-client-last-active">
                                {activityData.map((c, i) => (
                                    <div key={i} className="to-last-active-row">
                                        <span className="to-last-active-name">{c.name}</span>
                                        <span className="to-last-active-time">{formatTime(c.lastActive)}</span>
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

                {/* Clients */}
                <div className="to-card to-card-clients">
                    <div className="to-card-header">
                        <h2 className="to-card-title">Your Clients</h2>
                        <button className="to-card-link" onClick={() => onNavigate('clients')}>View All</button>
                    </div>
                    {clients.length > 0 ? (
                        <div className="to-clients-list">
                            {clients.slice(0, 5).map((client, i) => (
                                <div key={i} className="to-client-item">
                                    <div className="to-client-avatar">{client.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                    <div className="to-client-info">
                                        <span className="to-client-name">{client.name}</span>
                                        <span className="to-client-email">{client.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="to-empty">
                            <p>No clients yet</p>
                            <span className="to-empty-sub">Clients appear here once they message you</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerOverview;
