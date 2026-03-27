import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import axios from 'axios';
import './WeeklySteps.css';

const GOAL = 10000;

const WeeklySteps = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputVal, setInputVal] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = () => {
        axios.get('/api/v1/dailylogs/weekly-steps', { withCredentials: true })
            .then(res => setData(res.data.data || []))
            .catch(err => console.error('Weekly steps error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const today = data[data.length - 1];
    const todaySteps = today?.steps || 0;
    const totalWeek = data.reduce((s, d) => s + d.steps, 0);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!inputVal) return;
        setSaving(true);
        try {
            await axios.post('/api/v1/dailylogs/steps', { steps: parseInt(inputVal) }, { withCredentials: true });
            setInputVal('');
            fetchData();
        } catch (err) {
            console.error('Save steps error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="progress-card ws-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>Weekly Steps</h3>
                </div>
                <form className="ws-log-form" onSubmit={handleSave}>
                    <input
                        type="number"
                        min="0"
                        max="100000"
                        placeholder="Today's steps"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        className="ws-log-input"
                    />
                    <button type="submit" disabled={saving || !inputVal} className="ws-log-btn">
                        {saving ? '…' : 'Save'}
                    </button>
                </form>
            </div>

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
