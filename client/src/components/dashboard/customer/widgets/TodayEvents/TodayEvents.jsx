import React, { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import axios from 'axios';
import './TodayEvents.css';

const TodayEvents = ({ onNavigate }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    useEffect(() => {
        axios.get('/api/v1/schedule/my-appointments', { withCredentials: true })
            .then(res => {
                const all = res.data.data || [];
                const todayEvents = all
                    .filter(e => String(e.date || '').split('T')[0] === todayDate)
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

    const count = events.length;

    return (
        <div className="te-container">
            <span className="te-label">TODAY'S SCHEDULE</span>
            <h2 className="te-title">
                {loading ? '—' : count === 0 ? '0' : count} {count === 1 ? 'EVENT' : 'EVENTS'}
            </h2>
            <div className="te-divider" />

            {loading ? (
                <div className="te-loading"><div className="te-spinner" /></div>
            ) : count === 0 ? (
                <div className="te-empty">
                    <CalendarDays size={32} />
                    <p>No events today</p>
                </div>
            ) : (
                <div className="te-list">
                    {events.map((ev, i) => (
                        <div key={ev.id || i} className="te-event">
                            <span className="te-event-title">{ev.title}</span>
                            <span className="te-event-time">{fmt(ev.startTime)} – {fmt(ev.endTime)}</span>
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
