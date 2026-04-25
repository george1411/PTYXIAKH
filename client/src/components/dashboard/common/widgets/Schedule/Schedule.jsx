import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import './Schedule.css';

const DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_ABBR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const EVENT_COLORS = [
    { id: 'event-1', bg: '#3d3d5c',  label: 'Dark' },
    { id: 'event-2', bg: '#818CF8',  label: 'Purple' },
    { id: 'event-3', bg: '#38bdf8',  label: 'Cyan' },
    { id: 'event-4', bg: '#4ade80',  label: 'Green' },
    { id: 'event-5', bg: '#f87171',  label: 'Red' },
];

const DURATION_OPTIONS = [
    { label: '30 min',   value: 30  },
    { label: '1 hour',   value: 60  },
    { label: '1.5 hrs',  value: 90  },
    { label: '2 hours',  value: 120 },
    { label: '2.5 hrs',  value: 150 },
    { label: '3 hours',  value: 180 },
];

const TIME_START  = 6;
const TIME_END    = 24;
const SLOT_HEIGHT = 50;
const SLOTS_COUNT = (TIME_END - TIME_START) * 2;

function timeToMinutes(t) { const [h,m]=t.split(':').map(Number); return h*60+m; }
function minutesToTime(m) { const h=Math.floor(m/60); return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
function formatTime12(t) {
    const [h,m]=t.split(':').map(Number);
    return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dayNameFromDate(ds) {
    const d = new Date(ds+'T12:00:00');
    const idx = d.getDay();
    return DAYS[idx===0?6:idx-1];
}
function isToday(d) {
    const n = new Date();
    return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}
function getColorBg(id) { return EVENT_COLORS.find(c=>c.id===id)?.bg || EVENT_COLORS[0].bg; }
function generateTimeOptions() {
    const opts=[];
    for(let h=TIME_START;h<=TIME_END;h++) {
        for(let m=0;m<60;m+=15) {
            if(h===TIME_END){opts.push('24:00');break;}
            opts.push(minutesToTime(h*60+m));
        }
    }
    return opts;
}
const TIME_OPTIONS = generateTimeOptions();

// ─── Appointment Modal ────────────────────────────────────────
const AppointmentModal = ({ initialDate, event, onSave, onDelete, onClose, isNew, isTrainer }) => {
    const [title,    setTitle]    = useState(event?.title    || '');
    const [date,     setDate]     = useState(event?.date     || initialDate || dateStr(new Date()));
    const [start,    setStart]    = useState(event?.start    || '09:00');
    const [clientId, setClientId] = useState(event?.clientId ? String(event.clientId) : '');
    const [groupId,  setGroupId]  = useState(event?.groupId  ? String(event.groupId)  : '');
    const [assignTo, setAssignTo] = useState(event?.groupId ? 'group' : event?.clientId ? 'client' : 'none');
    const [clients,  setClients]  = useState([]);
    const [groups,   setGroups]   = useState([]);
    const [duration, setDuration] = useState(() => {
        if (event?.start && event?.end) return timeToMinutes(event.end) - timeToMinutes(event.start);
        return 60;
    });
    const [color, setColor] = useState(event?.color || 'event-2');

    useEffect(() => {
        if (!isTrainer) return;
        Promise.all([
            axios.get('/api/v1/trainer/clients', { withCredentials: true }).then(r => setClients(r.data.data || [])),
            axios.get('/api/v1/groups', { withCredentials: true }).then(r => setGroups(r.data.data || [])),
        ]).catch(() => {});
    }, [isTrainer]);

    const end = minutesToTime(Math.min(timeToMinutes(start) + duration, 24*60));
    const selectedClient = clients.find(c => String(c.id) === clientId);
    const selectedGroup  = groups.find(g => String(g.id) === groupId);

    const handleSave = () => {
        if (!title.trim() || !date) return;
        onSave({
            ...event,
            title: title.trim(), date, day: dayNameFromDate(date), start, end, color,
            clientId: assignTo === 'client' && clientId ? parseInt(clientId) : null,
            clientName: assignTo === 'client' ? selectedClient?.name || null : null,
            groupId: assignTo === 'group' && groupId ? parseInt(groupId) : null,
            groupName: assignTo === 'group' ? selectedGroup?.name || null : null,
        });
    };

    return (
        <div className="sched-modal-overlay" onClick={onClose}>
            <div className="sched-modal" onClick={e=>e.stopPropagation()}>
                <div className="sched-modal-header">
                    <h3>{isNew ? 'Add appointment' : 'Edit appointment'}</h3>
                    <button className="sched-modal-close" onClick={onClose}><X size={18}/></button>
                </div>
                <div className="sched-modal-body">
                    <label className="sched-label">
                        Title
                        <input type="text" className="sched-input" value={title}
                            onChange={e=>setTitle(e.target.value)} placeholder="e.g. PT Session" autoFocus />
                    </label>
                    <div className="sched-time-row">
                        <label className="sched-label">
                            Date
                            <input type="date" className="sched-input" value={date} onChange={e=>setDate(e.target.value)} />
                        </label>
                        <label className="sched-label">
                            Start Time
                            <select className="sched-input" value={start} onChange={e=>setStart(e.target.value)}>
                                {TIME_OPTIONS.map(t=><option key={t} value={t}>{formatTime12(t)}</option>)}
                            </select>
                        </label>
                        <label className="sched-label">
                            Duration
                            <select className="sched-input" value={duration} onChange={e=>setDuration(Number(e.target.value))}>
                                {DURATION_OPTIONS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </label>
                    </div>
                    {isTrainer && (
                        <>
                            <label className="sched-label">
                                Assign to
                                <select className="sched-input" value={assignTo} onChange={e=>setAssignTo(e.target.value)}>
                                    <option value="none">— No assignment —</option>
                                    <option value="client">Client</option>
                                    <option value="group">Group</option>
                                </select>
                            </label>
                            {assignTo === 'client' && (
                                <label className="sched-label">
                                    Client
                                    <select className="sched-input" value={clientId} onChange={e=>setClientId(e.target.value)}>
                                        <option value="">— Select client —</option>
                                        {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </label>
                            )}
                            {assignTo === 'group' && (
                                <label className="sched-label">
                                    Group
                                    <select className="sched-input" value={groupId} onChange={e=>setGroupId(e.target.value)}>
                                        <option value="">— Select group —</option>
                                        {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </label>
                            )}
                        </>
                    )}
                    <div className="sched-label">
                        Color
                        <div className="sched-color-picker">
                            {EVENT_COLORS.map(c=>(
                                <button key={c.id} className={`sched-color-btn ${color===c.id?'active':''}`}
                                    style={{backgroundColor:c.bg}} onClick={()=>setColor(c.id)} title={c.label}/>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="sched-modal-footer">
                    {!isNew && (
                        <button className="sched-btn sched-btn-delete" onClick={()=>onDelete(event.id)}>
                            <Trash2 size={14}/> Delete
                        </button>
                    )}
                    <button className="sched-btn sched-btn-save" onClick={handleSave}>
                        {isNew ? 'Add' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Monthly View ─────────────────────────────────────────────
const MonthlyView = ({ currentDate, events, onDayClick, onEventClick }) => {
    const year  = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay();
    const daysFromMonday = startDow===0 ? 6 : startDow-1;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - daysFromMonday);

    const days = Array.from({length:42}, (_,i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate()+i);
        return d;
    });

    const todayStr = dateStr(new Date());
    const eventsByDate = {};
    events.forEach(ev => {
        if (ev.date) {
            if (!eventsByDate[ev.date]) eventsByDate[ev.date]=[];
            eventsByDate[ev.date].push(ev);
        }
    });

    return (
        <div className="cal-month-wrap">
            <div className="cal-month-headers">
                {DAY_ABBR.map(d=><div key={d} className="cal-month-header-cell">{d}</div>)}
            </div>
            <div className="cal-month-days">
                {days.map((day,i) => {
                    const ds = dateStr(day);
                    const inMonth = day.getMonth()===month;
                    const today   = ds===todayStr;
                    const evs     = eventsByDate[ds] || [];
                    return (
                        <div key={i} className={`cal-month-day${!inMonth?' other-month':''}${today?' today':''}`}
                            onClick={()=>onDayClick && onDayClick(ds)}>
                            <span className="cal-month-day-num">{day.getDate()}</span>
                            <div className="cal-month-day-events">
                                {evs.slice(0,3).map((ev,ei)=>{
                                    const dur = ev.start && ev.end ? timeToMinutes(ev.end) - timeToMinutes(ev.start) : null;
                                    const durLabel = dur ? (dur >= 60 ? `${dur/60}h` : `${dur}m`) : null;
                                    return (
                                        <div key={ei} className="cal-month-event-pill"
                                            style={{background: getColorBg(ev.color)}}
                                            onClick={e=>{e.stopPropagation();onEventClick(ev);}}>
                                            <span className="cal-pill-top">{formatTime12(ev.start)} · {ev.title}</span>
                                            {(ev.clientName || ev.groupName || durLabel) && (
                                                <span className="cal-pill-sub">
                                                    {ev.groupName && `👥 ${ev.groupName.split(' ')[0]}`}
                                                    {ev.clientName && !ev.groupName && ev.clientName.split(' ')[0]}
                                                    {(ev.clientName || ev.groupName) && durLabel && ' · '}
                                                    {durLabel}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                {evs.length>3 && <div className="cal-month-event-more">+{evs.length-3} more</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Weekly View ──────────────────────────────────────────────
const WeeklyView = ({ currentDate, events, onSlotClick, onEventClick }) => {
    const dayOfWeek = currentDate.getDay();
    const diffToMonday = dayOfWeek===0 ? -6 : 1-dayOfWeek;
    const monday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+diffToMonday);

    const timeSlots = Array.from({length:SLOTS_COUNT}, (_,i) => minutesToTime(TIME_START*60+i*30));

    return (
        <div className="cd-schedule-grid-container">
            <div className="cd-schedule-grid">
                <div className="cd-schedule-timeline">
                    <div className="cd-schedule-timeline-header"/>
                    {timeSlots.map((t,i)=>(
                        <div key={i} className="cd-schedule-timeline-slot">
                            {i%2===0 && <span>{formatTime12(t)}</span>}
                        </div>
                    ))}
                </div>
                {DAYS.map((day,dayIndex)=>{
                    const colDate = new Date(monday);
                    colDate.setDate(monday.getDate()+dayIndex);
                    const colDs = dateStr(colDate);
                    const dayEvents = events.filter(ev => ev.date===colDs || (!ev.date && ev.day===day));
                    const todayCol = isToday(colDate);
                    return (
                        <div key={day} className="cd-schedule-day-col">
                            <div className={`cd-schedule-day-header${todayCol?' is-today':''}`}>
                                <span className="cd-schedule-day-name">{DAY_ABBR[dayIndex]}</span>
                                <span className={`cd-schedule-day-date${todayCol?' is-today':''}`}>
                                    {colDate.getDate()}/{colDate.getMonth()+1}
                                </span>
                            </div>
                            <div className="cd-schedule-day-body"
                                onClick={e=>{
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const slotIdx = Math.floor((e.clientY-rect.top)/SLOT_HEIGHT);
                                    const mins = TIME_START*60+slotIdx*30;
                                    onSlotClick(colDs, minutesToTime(mins));
                                }}>
                                {timeSlots.map((_,i)=>(
                                    <div key={i} className="cd-schedule-slot-line" style={{top:`${i*SLOT_HEIGHT}px`}}/>
                                ))}
                                {dayEvents.map(ev=>{
                                    const startMin = timeToMinutes(ev.start);
                                    const endMin   = timeToMinutes(ev.end);
                                    const baseMin  = TIME_START*60;
                                    const top    = ((startMin-baseMin)/30)*SLOT_HEIGHT;
                                    const height = Math.max(((endMin-startMin)/30)*SLOT_HEIGHT, SLOT_HEIGHT/2);
                                    return (
                                        <div key={ev.id} className="cd-schedule-event"
                                            style={{top:`${top}px`,height:`${height}px`,background:getColorBg(ev.color)}}
                                            onClick={e=>{e.stopPropagation();onEventClick(ev);}}>
                                            <span className="cd-schedule-event-time">{formatTime12(ev.start)} – {formatTime12(ev.end)}</span>
                                            <span className="cd-schedule-event-title">{ev.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Daily View ───────────────────────────────────────────────
const DailyView = ({ currentDate, events, onSlotClick, onEventClick }) => {
    const ds = dateStr(currentDate);
    const dayEvents = events.filter(ev => ev.date===ds || (!ev.date && ev.day===DAYS[currentDate.getDay()===0?6:currentDate.getDay()-1]));
    const timeSlots = Array.from({length:SLOTS_COUNT}, (_,i) => minutesToTime(TIME_START*60+i*30));

    return (
        <div className="cd-schedule-grid-container">
            <div className="cd-schedule-grid" style={{minWidth:'auto'}}>
                <div className="cd-schedule-timeline">
                    <div className="cd-schedule-timeline-header"/>
                    {timeSlots.map((t,i)=>(
                        <div key={i} className="cd-schedule-timeline-slot">
                            {i%2===0 && <span>{formatTime12(t)}</span>}
                        </div>
                    ))}
                </div>
                <div className="cd-schedule-day-col" style={{flex:1}}>
                    <div className={`cd-schedule-day-header${isToday(currentDate)?' is-today':''}`}>
                        <span className="cd-schedule-day-name">
                            {currentDate.toLocaleDateString('en-US',{weekday:'short'})}
                        </span>
                        <span className={`cd-schedule-day-date${isToday(currentDate)?' is-today':''}`}>
                            {currentDate.getDate()}/{currentDate.getMonth()+1}
                        </span>
                    </div>
                    <div className="cd-schedule-day-body"
                        onClick={e=>{
                            const rect = e.currentTarget.getBoundingClientRect();
                            const slotIdx = Math.floor((e.clientY-rect.top)/SLOT_HEIGHT);
                            onSlotClick(ds, minutesToTime(TIME_START*60+slotIdx*30));
                        }}>
                        {timeSlots.map((_,i)=>(
                            <div key={i} className="cd-schedule-slot-line" style={{top:`${i*SLOT_HEIGHT}px`}}/>
                        ))}
                        {dayEvents.map(ev=>{
                            const startMin = timeToMinutes(ev.start);
                            const endMin   = timeToMinutes(ev.end);
                            const baseMin  = TIME_START*60;
                            const top    = ((startMin-baseMin)/30)*SLOT_HEIGHT;
                            const height = Math.max(((endMin-startMin)/30)*SLOT_HEIGHT, SLOT_HEIGHT/2);
                            return (
                                <div key={ev.id} className="cd-schedule-event"
                                    style={{top:`${top}px`,height:`${height}px`,background:getColorBg(ev.color)}}
                                    onClick={e=>{e.stopPropagation();onEventClick(ev);}}>
                                    <span className="cd-schedule-event-time">{formatTime12(ev.start)} – {formatTime12(ev.end)}</span>
                                    <span className="cd-schedule-event-title">{ev.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Schedule Component ──────────────────────────────────
const Schedule = ({ onNavigate, fullPage, hideTitle, isTrainer, readOnly }) => {
    const [view,        setView]        = useState('monthly'); // 'weekly' | 'monthly'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events,      setEvents]      = useState([]);
    const [modal,       setModal]       = useState(null); // { date, event?, isNew }

    const mapEvent = ev => ({
        id:         ev.id,
        day:        ev.day,
        start:      ev.startTime,
        end:        ev.endTime,
        title:      ev.title,
        color:      ev.color || 'event-2',
        date:       ev.date ? String(ev.date).split('T')[0] : null,
        clientId:   ev.clientId || null,
        clientName: ev.clientName || ev.trainerName || null,
        groupId:    ev.groupId || null,
        groupName:  ev.groupName || null,
    });

    useEffect(() => {
        if (!fullPage) return;
        const url = readOnly ? '/api/v1/schedule/my-appointments' : '/api/v1/schedule';
        axios.get(url, { withCredentials: true })
            .then(res => setEvents((res.data.data||[]).map(mapEvent)))
            .catch(console.error);
    }, [fullPage, readOnly]);

    if (!fullPage) return <ScheduleWidget onNavigate={onNavigate} hideTitle={hideTitle} />;

    // ── Navigation label ──
    const navLabel = useMemo(() => {
        if (view==='monthly') {
            return currentDate.toLocaleDateString('en-US',{month:'long',year:'numeric'});
        }
        if (view==='weekly') {
            const dow = currentDate.getDay();
            const diff = dow===0?-6:1-dow;
            const mon = new Date(currentDate); mon.setDate(currentDate.getDate()+diff);
            const sun = new Date(mon); sun.setDate(mon.getDate()+6);
            return `${mon.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${sun.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
        }
        return currentDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    }, [view, currentDate]);

    const navigate = (dir) => {
        const d = new Date(currentDate);
        if (view==='monthly') { d.setMonth(d.getMonth()+dir); d.setDate(1); }
        else if (view==='weekly') d.setDate(d.getDate()+dir*7);
        else d.setDate(d.getDate()+dir);
        setCurrentDate(d);
    };

    // ── Handlers ──
    const openNew = (date, startTime='09:00') => { if (readOnly) return; setModal({ date, startTime, isNew: true }); };
    const openEdit = (ev) => { if (readOnly) return; setModal({ date: ev.date, event: ev, isNew: false }); };

    const handleSave = async (data) => {
        try {
            const body = {
                title: data.title, day: data.day,
                startTime: data.start, endTime: data.end,
                color: data.color, date: data.date,
                clientId: data.clientId || null,
                groupId: data.groupId || null,
            };
            if (modal.isNew) {
                const res = await axios.post('/api/v1/schedule', body, { withCredentials: true });
                const c = res.data.data;
                setEvents(prev=>[...prev, { ...mapEvent(c), clientName: data.clientName, groupName: data.groupName, date: data.date }]);
            } else {
                await axios.put(`/api/v1/schedule/${data.id}`, body, { withCredentials: true });
                setEvents(prev=>prev.map(ev=>ev.id===data.id ? { ...data } : ev));
            }
        } catch(e) { console.error(e); }
        setModal(null);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/schedule/${id}`,{withCredentials:true});
            setEvents(prev=>prev.filter(ev=>ev.id!==id));
        } catch(e) { console.error(e); }
        setModal(null);
    };

    return (
        <div className="cd-schedule-wrapper">
            {/* ── Top bar ── */}
            <div className="cd-schedule-top">
                {/* View toggle */}
                <div className="cal-view-toggle">
                    {['weekly','monthly'].map(v=>(
                        <button key={v} className={`cal-view-btn${view===v?' active':''}`}
                            onClick={()=>setView(v)}>
                            {v.charAt(0).toUpperCase()+v.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="cd-schedule-week-nav">
                    <button className="cd-schedule-nav-btn" onClick={()=>navigate(-1)}><ChevronLeft size={16}/></button>
                    <span className="cd-schedule-week-label">{navLabel}</span>
                    <button className="cd-schedule-nav-btn" onClick={()=>navigate(1)}><ChevronRight size={16}/></button>
                    <button className="cd-schedule-today-btn" onClick={()=>setCurrentDate(new Date())}>Today</button>
                </div>

                {/* Add button */}
                {!readOnly && (
                    <button className="cd-schedule-add-btn" onClick={()=>openNew(dateStr(currentDate))}>
                        <Plus size={15}/> ADD
                    </button>
                )}
            </div>

            {/* ── View ── */}
            {view==='monthly' && (
                <MonthlyView currentDate={currentDate} events={events}
                    onDayClick={readOnly ? null : ds=>openNew(ds)}
                    onEventClick={readOnly ? null : ev=>openEdit(ev)} />
            )}
            {view==='weekly' && (
                <WeeklyView currentDate={currentDate} events={events}
                    onSlotClick={readOnly ? null : (ds,t)=>openNew(ds,t)}
                    onEventClick={readOnly ? null : ev=>openEdit(ev)} />
            )}

            {/* ── Modal ── */}
            {modal && (
                <AppointmentModal
                    initialDate={modal.date}
                    event={modal.event}
                    isNew={modal.isNew}
                    isTrainer={isTrainer}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={()=>setModal(null)}
                />
            )}
        </div>
    );
};

// ─── Overview Widget (customer dashboard cards) ───────────────
const ScheduleWidget = ({ onNavigate, hideTitle }) => {
    const [scheduleData, setScheduleData] = useState([]);
    const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const todayIndex = (() => { const d=new Date().getDay(); return d===0?6:d-1; })();

    useEffect(() => {
        axios.get('/api/v1/workouts',{withCredentials:true})
            .then(res=>{
                const workouts = res.data.data||[];
                setScheduleData(daysOfWeek.map((day,index)=>{
                    const w = workouts.find(w=>w.day===day);
                    return { id:w?w.id:`rest-${day}`, label:day, title:w?w.name:null, exercises:w?.exercises||[], isToday:index===todayIndex };
                }));
            }).catch(console.error);
    },[]);

    return (
        <div className="schedule-container">
            {!hideTitle && <div className="schedule-header"><h3 className="schedule-title">Weekly Schedule</h3></div>}
            <div className="schedule-list">
                {scheduleData.map(item=>(
                    <div key={item.id} className={`schedule-card ${item.isToday?'is-today':'not-today'}`}>
                        <div className="card-header">
                            <span className="card-label">{item.label.toUpperCase()}</span>
                            {item.isToday && <div className="today-indicator"/>}
                        </div>
                        <div className="card-workout-name">
                            {item.title ? item.title.toUpperCase() : <span className="card-rest-label">Rest Day</span>}
                        </div>
                        {item.title && <div className="card-divider"/>}
                        {item.exercises.length>0 && (
                            <div className="card-exercises">
                                {item.exercises.slice(0,4).map((ex,i)=>(
                                    <div key={i} className="card-exercise-row">
                                        <span className="card-ex-name">{ex.exerciseName}</span>
                                    </div>
                                ))}
                                {item.exercises.length>4 && <div className="card-ex-more">+{item.exercises.length-4} more</div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;
