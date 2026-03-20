import React, { useEffect, useState, useMemo } from 'react';
import { Plus, X, Trash2, Edit3, Clock, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './Schedule.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Get the Monday of the current ISO week, then offset by `weekOffset` weeks
function getMondayOfWeek(weekOffset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday + weekOffset * 7);
    return monday;
}

function formatWeekRange(monday) {
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    const opts = { month: 'short', day: 'numeric' };
    const monStr = monday.toLocaleDateString('en-US', opts);
    const friStr = friday.toLocaleDateString('en-US', opts);
    const year = monday.getFullYear();
    return `${monStr} – ${friStr}, ${year}`;
}

function getDateForDay(monday, dayIndex) {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayIndex);
    return d;
}

function isToday(date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
}
const TIME_START = 6;  // 06:00
const TIME_END = 24;   // 24:00 (midnight)
const SLOT_HEIGHT = 50; // pixels per 30 min
const SLOTS_COUNT = (TIME_END - TIME_START) * 2; // 36 half-hour slots

const EVENT_COLORS = [
    { id: 'event-1', bg: '#555', label: 'Teal' },
    { id: 'event-2', bg: '#444', label: 'Purple' },
    { id: 'event-3', bg: '#888', label: 'Sage' },
    { id: 'event-4', bg: '#666', label: 'Orange' },
];

// Color assigned to workout program events
const WORKOUT_COLOR = 'event-2';

function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getEventStyle(start, end) {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const baseMin = TIME_START * 60;
    const top = ((startMin - baseMin) / 30) * SLOT_HEIGHT;
    const height = ((endMin - startMin) / 30) * SLOT_HEIGHT;
    return { top: `${top}px`, height: `${Math.max(height, SLOT_HEIGHT / 2)}px` };
}

function getColorBg(colorId) {
    const found = EVENT_COLORS.find(c => c.id === colorId);
    return found ? found.bg : EVENT_COLORS[0].bg;
}

// Generate time options for select dropdowns (06:00 to 24:00 in 15-min increments)
function generateTimeOptions() {
    const options = [];
    for (let h = TIME_START; h <= TIME_END; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === TIME_END) { options.push('24:00'); break; }
            options.push(minutesToTime(h * 60 + m));
        }
    }
    return options;
}

const TIME_OPTIONS = generateTimeOptions();

// ─── Event Modal ─────────────────────────────────────────────
const EventModal = ({ event, onSave, onDelete, onClose, isNew }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [day, setDay] = useState(event?.day || 'Monday');
    const [start, setStart] = useState(event?.start || '09:00');
    const [end, setEnd] = useState(event?.end || '10:00');
    const [color, setColor] = useState(event?.color || 'event-1');

    const handleSave = () => {
        if (!title.trim()) return;
        if (timeToMinutes(end) <= timeToMinutes(start)) return;
        onSave({ ...event, title: title.trim(), day, start, end, color });
    };

    return (
        <div className="sched-modal-overlay" onClick={onClose}>
            <div className="sched-modal" onClick={e => e.stopPropagation()}>
                <div className="sched-modal-header">
                    <h3>{isNew ? 'Add Event' : 'Edit Event'}</h3>
                    <button className="sched-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="sched-modal-body">
                    {/* Title */}
                    <label className="sched-label">
                        Event Title
                        <input
                            type="text"
                            className="sched-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Abs Circuit"
                            autoFocus
                        />
                    </label>

                    {/* Day */}
                    <label className="sched-label">
                        Day
                        <select className="sched-input" value={day} onChange={e => setDay(e.target.value)}>
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </label>

                    {/* Time row */}
                    <div className="sched-time-row">
                        <label className="sched-label">
                            Start
                            <select className="sched-input" value={start} onChange={e => setStart(e.target.value)}>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="sched-label">
                            End
                            <select className="sched-input" value={end} onChange={e => setEnd(e.target.value)}>
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Color picker */}
                    <div className="sched-label">
                        Color
                        <div className="sched-color-picker">
                            {EVENT_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    className={`sched-color-btn ${color === c.id ? 'active' : ''}`}
                                    style={{ backgroundColor: c.bg }}
                                    onClick={() => setColor(c.id)}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="sched-modal-footer">
                    {!isNew && (
                        <button className="sched-btn sched-btn-delete" onClick={() => onDelete(event.id)}>
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                    <button className="sched-btn sched-btn-save" onClick={handleSave}>
                        <Save size={14} /> {isNew ? 'Add' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Schedule Component ─────────────────────────────────
const Schedule = ({ onNavigate, fullPage, hideTitle }) => {
    const [events, setEvents] = useState([]);
    const [modalEvent, setModalEvent] = useState(null);
    const [isNewEvent, setIsNewEvent] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);

    // Computed Monday of the displayed week
    const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
    const weekLabel = useMemo(() => formatWeekRange(monday), [monday]);

    // Fetch workout program + saved schedule events from API
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const schedRes = await axios.get('/api/v1/schedule', { withCredentials: true });
                const savedEvents = (schedRes.data.data || []).map(ev => ({
                    id: ev.id,
                    day: ev.day,
                    start: ev.startTime,
                    end: ev.endTime,
                    title: ev.title,
                    color: ev.color || 'event-1',
                    date: ev.date || null,
                    isWorkout: false,
                }));

                setEvents(savedEvents);
            } catch (error) {
                console.error('Error fetching schedule data:', error);
            }
        };
        if (fullPage) fetchAll();
    }, [fullPage]);

    // If not fullPage, render the old card widget (overview)
    if (!fullPage) {
        return <ScheduleWidget onNavigate={onNavigate} hideTitle={hideTitle} />;
    }

    const timeSlots = [];
    for (let i = 0; i < SLOTS_COUNT; i++) {
        const minutes = TIME_START * 60 + i * 30;
        timeSlots.push(minutesToTime(minutes));
    }

    const handleDayClick = (day, dayIndex, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const slotIndex = Math.floor(y / SLOT_HEIGHT);
        const clickedMinutes = TIME_START * 60 + slotIndex * 30;
        const startTime = minutesToTime(clickedMinutes);
        const endTime = minutesToTime(clickedMinutes + 60);

        // Compute specific date for this day in the current week view
        const eventDate = getDateForDay(monday, dayIndex);
        const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

        setModalEvent({
            id: null,
            day,
            start: startTime,
            end: endTime,
            title: '',
            color: 'event-1',
            date: dateStr,
        });
        setIsNewEvent(true);
    };

    const handleEventClick = (ev, e) => {
        e.stopPropagation();
        if (ev.isWorkout) return;
        setModalEvent({ ...ev });
        setIsNewEvent(false);
    };

    const handleSave = async (data) => {
        try {
            if (isNewEvent) {
                // Compute date from day + current week's monday
                const dayIdx = DAYS.indexOf(data.day);
                const eventDate = getDateForDay(monday, dayIdx >= 0 ? dayIdx : 0);
                const dateStr = data.date || eventDate.toISOString().split('T')[0];

                // POST to create
                const res = await axios.post('/api/v1/schedule', {
                    title: data.title,
                    day: data.day,
                    startTime: data.start,
                    endTime: data.end,
                    color: data.color,
                    date: dateStr,
                }, { withCredentials: true });

                const created = res.data.data;
                setEvents(prev => [...prev, {
                    id: created.id,
                    day: created.day,
                    start: created.startTime,
                    end: created.endTime,
                    title: created.title,
                    color: created.color,
                    date: created.date || dateStr,
                    isWorkout: false,
                }]);
            } else {
                // PUT to update
                await axios.put(`/api/v1/schedule/${data.id}`, {
                    title: data.title,
                    day: data.day,
                    startTime: data.start,
                    endTime: data.end,
                    color: data.color,
                    date: data.date,
                }, { withCredentials: true });

                setEvents(prev => prev.map(ev => ev.id === data.id ? { ...data, isWorkout: false } : ev));
            }
        } catch (error) {
            console.error('Error saving schedule event:', error);
        }
        setModalEvent(null);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/schedule/${id}`, { withCredentials: true });
            setEvents(prev => prev.filter(ev => ev.id !== id));
        } catch (error) {
            console.error('Error deleting schedule event:', error);
        }
        setModalEvent(null);
    };

    return (
        <div className="cd-schedule-wrapper">
            {/* Header */}
            <div className="cd-schedule-top">
                <div className="cd-schedule-top-left">
                    <h2>Weekly Schedule</h2>
                </div>

                {/* Week navigation */}
                <div className="cd-schedule-week-nav">
                    <button className="cd-schedule-nav-btn" onClick={() => setWeekOffset(prev => prev - 1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <span className="cd-schedule-week-label">{weekLabel}</span>
                    <button className="cd-schedule-nav-btn" onClick={() => setWeekOffset(prev => prev + 1)}>
                        <ChevronRight size={18} />
                    </button>
                    {weekOffset !== 0 && (
                        <button className="cd-schedule-today-btn" onClick={() => setWeekOffset(0)}>
                            Today
                        </button>
                    )}
                </div>

                <button
                    className="cd-schedule-add-btn"
                    onClick={() => {
                        const dateStr = monday.toISOString().split('T')[0]; // Monday of current week
                        setModalEvent({
                            id: null, day: 'Monday', start: '09:00', end: '10:00', title: '', color: 'event-1', date: dateStr
                        });
                        setIsNewEvent(true);
                    }}
                >
                    <Plus size={16} /> Add Event
                </button>
            </div>

            {/* Grid */}
            <div className="cd-schedule-grid-container">
                <div className="cd-schedule-grid">
                    {/* Timeline */}
                    <div className="cd-schedule-timeline">
                        <div className="cd-schedule-timeline-header"></div>
                        {timeSlots.map((t, i) => (
                            <div key={i} className="cd-schedule-timeline-slot">
                                {i % 2 === 0 && <span>{t}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Day columns */}
                    {DAYS.map((day, dayIndex) => {
                        // Compute the date string for this day column
                        const colDate = getDateForDay(monday, dayIndex);
                        const colDateStr = colDate.toISOString().split('T')[0]; // YYYY-MM-DD

                        // Filter events: workout events always show, user events only if date matches this column's date
                        const dayEvents = events.filter(ev => {
                            if (ev.day !== day) return false;
                            if (ev.isWorkout) return true; // Recurring weekly
                            // User events: show only if date matches (or if no date → legacy, show on current week)
                            if (!ev.date) return weekOffset === 0;
                            return ev.date === colDateStr;
                        });
                        const todayClass = isToday(colDate) ? ' is-today' : '';
                        const dateLabel = `${colDate.getDate()}/${colDate.getMonth() + 1}`;
                        return (
                            <div key={day} className="cd-schedule-day-col">
                                <div className={`cd-schedule-day-header${todayClass}`}>
                                    <span className="cd-schedule-day-name">{DAY_ABBR[dayIndex]}</span>
                                    <span className={`cd-schedule-day-date${todayClass}`}>{dateLabel}</span>
                                </div>
                                <div
                                    className="cd-schedule-day-body"
                                    onClick={(e) => handleDayClick(day, dayIndex, e)}
                                >
                                    {/* Grid lines */}
                                    {timeSlots.map((_, i) => (
                                        <div key={i} className="cd-schedule-slot-line" style={{ top: `${i * SLOT_HEIGHT}px` }} />
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map(ev => {
                                        const style = getEventStyle(ev.start, ev.end);
                                        return (
                                            <div
                                                key={ev.id}
                                                className={`cd-schedule-event`}
                                                style={{
                                                    ...style,
                                                    backgroundColor: getColorBg(ev.color),
                                                }}
                                                onClick={(e) => handleEventClick(ev, e)}
                                            >
                                                <span className="cd-schedule-event-time">
                                                    {ev.start} – {ev.end}
                                                </span>
                                                <span className="cd-schedule-event-title">
                                                    {ev.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {modalEvent && (
                <EventModal
                    event={modalEvent}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => setModalEvent(null)}
                    isNew={isNewEvent}
                />
            )}
        </div>
    );
};

// ─── Overview Widget (card-based view with week nav) ─────────
const ScheduleWidget = ({ onNavigate, hideTitle }) => {
    const [scheduleData, setScheduleData] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [showPopup, setShowPopup] = useState(null);
    const [popupLoading, setPopupLoading] = useState(false);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const widgetMonday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
    const weekLabel = useMemo(() => formatWeekRange(widgetMonday), [widgetMonday]);
    const isCurrentWeek = weekOffset === 0;

    const getDateStr = (dayIndex) => {
        const d = new Date(widgetMonday);
        d.setDate(d.getDate() + dayIndex);
        return d.toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const response = await axios.get('/api/v1/workouts', { withCredentials: true });
                const workouts = response.data.data;
                const currentDayIndex = new Date().getDay();
                const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

                const calendarData = daysOfWeek.map((day, index) => {
                    const workoutForDay = workouts.find(w => w.day === day);
                    const isToday = isCurrentWeek && index === adjustedDayIndex;
                    return {
                        id: workoutForDay ? workoutForDay.id : `rest-${day}`,
                        label: day,
                        title: workoutForDay ? workoutForDay.name : 'Rest Day',
                        hasWorkout: !!workoutForDay,
                        isToday,
                        dayIndex: index,
                    };
                });
                setScheduleData(calendarData);
            } catch (error) {
                console.error("Error fetching schedule:", error);
            }
        };
        fetchWorkouts();
    }, [weekOffset, isCurrentWeek]);

    const handleShowWorkout = async (item) => {
        setPopupLoading(true);
        setShowPopup({ day: item.label, exercises: [] });
        try {
            const dateStr = getDateStr(item.dayIndex);
            const res = await axios.get(`/api/v1/workouts?date=${dateStr}`, { withCredentials: true });
            const workouts = res.data.data;
            const workoutForDay = workouts.find(w => w.day === item.label);
            if (workoutForDay && workoutForDay.exercises) {
                const exercises = workoutForDay.exercises.map(ex => ({
                    name: ex.exerciseName,
                    targetSets: parseInt(ex.sets) || 3,
                    targetReps: ex.reps || null,
                    targetKg: ex.weight || null,
                    logs: ex.logs || [],
                }));
                setShowPopup({ day: item.label, date: dateStr, exercises });
            } else {
                setShowPopup({ day: item.label, date: dateStr, exercises: [] });
            }
        } catch (error) {
            console.error("Error fetching workout logs:", error);
        } finally {
            setPopupLoading(false);
        }
    };

    return (
        <div className="schedule-container">
            {!hideTitle && (
                <div className="schedule-header">
                    <h3 className="schedule-title">Weekly Schedule</h3>
                </div>
            )}

            {/* Week navigation */}
            <div className="widget-week-nav">
                <button className="widget-nav-btn" onClick={() => setWeekOffset(prev => prev - 1)}>
                    <ChevronLeft size={14} />
                </button>
                <span className="widget-week-label">{weekLabel}</span>
                <button className="widget-nav-btn" onClick={() => setWeekOffset(prev => prev + 1)}>
                    <ChevronRight size={14} />
                </button>
                {weekOffset !== 0 && (
                    <button className="widget-today-btn" onClick={() => setWeekOffset(0)}>Today</button>
                )}
            </div>

            <div className="schedule-list custom-scrollbar">
                {scheduleData.map((item) => (
                    <div
                        key={item.id}
                        className={`schedule-card ${item.isToday ? 'is-today' : 'not-today'} ${item.hasWorkout ? 'has-workout' : ''}`}
                    >
                        <div className="card-header">
                            <span className="card-label">{item.label}</span>
                            {item.isToday && <div className="today-indicator"></div>}
                        </div>
                        <div className="card-content">
                            <h4 className={`card-title ${item.isToday ? 'today' : 'not-today'}`}>
                                {item.title}
                            </h4>
                        </div>
                        <div className={`card-footer ${item.isToday ? 'today' : 'not-today'}`}>
                            {item.hasWorkout && (
                                <button
                                    className={`workout-action-btn ${item.isToday ? 'btn-start' : 'btn-show'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowWorkout(item);
                                    }}
                                >
                                    Show
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Workout Log Popup */}
            {showPopup && (
                <div className="workout-log-overlay" onClick={() => setShowPopup(null)}>
                    <div className="workout-log-popup" onClick={e => e.stopPropagation()}>
                        <div className="workout-log-popup-header">
                            <div>
                                <h3>{showPopup.day}</h3>
                                <span className="workout-log-popup-date">{showPopup.date}</span>
                            </div>
                            <button className="workout-log-popup-close" onClick={() => setShowPopup(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="workout-log-popup-body">
                            {popupLoading ? (
                                <div className="workout-log-empty">Loading...</div>
                            ) : showPopup.exercises.length === 0 ? (
                                <div className="workout-log-empty">No workout data logged for this day.</div>
                            ) : (
                                showPopup.exercises.map((ex, i) => (
                                    <div key={i} className="workout-log-exercise">
                                        <h4 className="workout-log-exercise-name">{ex.name}</h4>
                                        <div className="workout-log-target">
                                            {ex.targetSets} sets
                                            {ex.targetReps ? ` × ${ex.targetReps} reps` : ''}
                                            {ex.targetKg ? ` @ ${ex.targetKg} kg` : ''}
                                        </div>
                                        {ex.logs.length > 0 && (
                                            <div className="workout-log-sets">
                                                <div className="workout-log-sets-header">
                                                    <span>Set</span><span>KG</span><span>Reps</span>
                                                </div>
                                                {ex.logs.map((log, j) => (
                                                    <div key={j} className="workout-log-set-row">
                                                        <span>{log.setNumber}</span>
                                                        <span className="workout-log-value">{log.kg}</span>
                                                        <span className="workout-log-value">{log.reps}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
