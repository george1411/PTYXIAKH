import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import axios from 'axios';
import './TodayEvents.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COLOR_MAP = {
    'event-1': '#e0e0e0',
    'event-2': '#a5b4fc',
    'event-3': '#38bdf8',
    'event-4': '#60a5fa',
};

const TodayEvents = ({ onNavigate }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const today     = DAYS[new Date().getDay()];
    const todayDate = new Date().toISOString().split('T')[0];
    const todayUpper = today.toUpperCase();

    useEffect(() => {
        axios.get('/api/v1/schedule', { withCredentials: true })
            .then(res => {
                const all = res.data.data || [];
                const todayEvents = all
                    .filter(e => e.date === todayDate)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                setEvents(todayEvents);
            })
            .catch(err => console.error('TodayEvents error:', err))
            .finally(() => setLoading(false));
    }, []);

    const fmt = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${((h % 12) || 12)}:${String(m).padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="te-container">
            <div className="te-top-row">
                <h2 className="te-title">Today's Schedule</h2>
            </div>
            <div className="te-divider" />

            {loading ? (
                <div className="te-loading"><div className="te-spinner" /></div>
            ) : events.length === 0 ? (
                <div className="te-empty">
                    <CalendarDays size={32} />
                    <p>No events today</p>
                </div>
            ) : (
                <div className="te-list">
                    {events.map((ev, i) => (
                        <div key={ev.id || i} className="te-event">
                            <div className="te-dot" style={{ background: COLOR_MAP[ev.color] || '#e0e0e0' }} />
                            <div className="te-event-info">
                                <span className="te-event-title">{ev.title}</span>
                                <span className="te-event-time">{fmt(ev.startTime)} – {fmt(ev.endTime)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="te-link-btn" onClick={() => onNavigate('schedule')}>
                View full schedule →
            </button>
        </div>
    );
};

export default TodayEvents;
