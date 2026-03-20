import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StreaksStats.css'; // Import the plain CSS

const StatItem = ({ value, label }) => (
    <div className="stat-item">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
    </div>
);

const StreaksStats = () => {
    const [stats, setStats] = useState({
        dayStreak: 0,
        weeklyWorkouts: 0,
        complianceScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/v1/stats', { withCredentials: true });
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching user stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="streaks-stats-container">
                <div className="streaks-header">
                    <h3 className="streaks-title">Streaks & Stats</h3>
                </div>
                <div style={{ color: 'gray', textAlign: 'center', marginTop: '1rem' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="streaks-stats-container">
            <div className="streaks-header">
                <h3 className="streaks-title">Streaks & Stats</h3>
            </div>
            <div className="stats-grid">
                <StatItem value={stats.dayStreak} label="Day Streak" />
                <StatItem value={stats.weeklyWorkouts} label="Workouts/Wk" />
                <StatItem value={`${stats.complianceScore}%`} label="Compliance" />
            </div>
        </div>
    );
};

export default StreaksStats;
