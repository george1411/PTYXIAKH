import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import axios from 'axios';
import './WeeklySteps.css';

const GOAL = 10000;

const WeeklySteps = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fitbitConnected, setFitbitConnected] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    const fetchData = () => {
        axios.get('/api/v1/dailylogs/weekly-steps', { withCredentials: true })
            .then(res => setData(res.data.data || []))
            .catch(err => console.error('Weekly steps error:', err))
            .finally(() => setLoading(false));
    };

    const checkFitbitStatus = () => {
        axios.get('/api/v1/fitbit/status', { withCredentials: true })
            .then(res => {
                setFitbitConnected(res.data.connected);
                if (res.data.connected) {
                    axios.post('/api/v1/fitbit/sync', {}, { withCredentials: true })
                        .then(() => fetchData())
                        .catch(err => {
                            const msg = err.response?.data?.message || 'Auto-sync failed';
                            setSyncMsg(msg);
                            setTimeout(() => setSyncMsg(''), 5000);
                        });
                }
            })
            .catch(() => setFitbitConnected(false));
    };

    useEffect(() => {
        fetchData();
        checkFitbitStatus();

        // Handle redirect back from Fitbit OAuth
        const params = new URLSearchParams(window.location.search);
        const fitbitParam = params.get('fitbit');
        if (fitbitParam === 'connected') {
            setFitbitConnected(true);
            setSyncMsg('Fitbit connected!');
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setSyncMsg(''), 3000);
        } else if (fitbitParam === 'error') {
            setSyncMsg('Fitbit connection failed. Try again.');
            window.history.replaceState({}, '', window.location.pathname);
            setTimeout(() => setSyncMsg(''), 4000);
        }
    }, []);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = data.find(d => d.date === todayStr);
    const todaySteps = todayEntry?.steps || 0;
    const totalWeek = data.reduce((s, d) => s + d.steps, 0);

    const handleFitbitConnect = () => {
        window.location.href = '/api/v1/fitbit/connect';
    };

    const handleFitbitSync = async () => {
        setSyncing(true);
        setSyncMsg('');
        try {
            await axios.post('/api/v1/fitbit/sync', {}, { withCredentials: true });
            setSyncMsg('Synced!');
            fetchData();
        } catch (err) {
            setSyncMsg('Sync failed.');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMsg(''), 3000);
        }
    };

    const handleFitbitDisconnect = async () => {
        try {
            await axios.delete('/api/v1/fitbit/disconnect', { withCredentials: true });
            setFitbitConnected(false);
            setSyncMsg('Fitbit disconnected.');
            setTimeout(() => setSyncMsg(''), 3000);
        } catch (err) {
            console.error('Disconnect error:', err);
        }
    };

    return (
        <div className="progress-card ws-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>Weekly Steps</h3>
                </div>
                <div className="ws-header-actions">
                    {!fitbitConnected && (
                        <button className="ws-fitbit-btn ws-connect-btn" onClick={handleFitbitConnect}>
                            Connect Fitbit
                        </button>
                    )}
                </div>
            </div>

            {syncMsg && (
                <div className="ws-sync-msg" style={{ color: syncMsg.toLowerCase().includes('fail') || syncMsg.toLowerCase().includes('error') ? '#f87171' : '#00b894' }}>
                    {syncMsg}
                </div>
            )}

            <div className="ws-stats-row">
                <div className="ws-stat">
                    <span className="ws-stat-value">{todaySteps.toLocaleString()}</span>
                    <span className="ws-stat-label">Today</span>
                </div>
                <div className="ws-stat-divider" />
                <div className="ws-stat">
                    <span className="ws-stat-value">{totalWeek.toLocaleString()}</span>
                    <span className="ws-stat-label">This Week</span>
                </div>
                <div className="ws-stat-divider" />
                <div className="ws-stat">
                    <span className="ws-stat-value">{GOAL.toLocaleString()}</span>
                    <span className="ws-stat-label">Daily Goal</span>
                </div>
            </div>

            {loading ? (
                <div className="progress-loading"><div className="progress-spinner" /></div>
            ) : (
                <div className="ws-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barSize={22} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
                            <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                                {data.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={entry.steps >= GOAL ? '#a5b4fc' : entry.steps > 0 ? '#3d3d5c' : '#2a2a2a'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default WeeklySteps;
