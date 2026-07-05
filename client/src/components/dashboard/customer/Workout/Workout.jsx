import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import axios from 'axios';
import './Workout.css';

// ─── Set Dot ──────────────────────────────────────────────────
function SetDot({ filled, ariaLabel }) {
    return (
        <div
            aria-label={ariaLabel}
            style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                background: filled ? 'rgba(165,180,252,0.18)' : 'transparent',
                border: `1.5px solid ${filled ? '#A5B4FC' : 'rgba(255,255,255,0.18)'}`,
                flexShrink: 0, transition: 'border-color 0.15s, background 0.15s',
            }}
        >
            {filled && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="#a5b4fc" strokeWidth="3"
                     strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </div>
    );
}

const G_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const G_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── CellInput ────────────────────────────────────────────────
function CellInput({ value, placeholder, onChange, onDoubleClick }) {
    return (
        <input
            type="number"
            value={value ?? ''}
            placeholder={String(placeholder ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            onDoubleClick={onDoubleClick}
            style={{
                width: '100%', height: 40,
                borderRadius: 10,
                background: '#0e0e0e',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#f0f0f0',
                fontSize: 18, fontWeight: 700,
                fontFamily: 'inherit',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em',
                textAlign: 'center',
                outline: 'none',
                padding: 0,
            }}
        />
    );
}

// ─── HistoryChart ─────────────────────────────────────────────
function HistoryChart({ history, pr }) {
    const [activeIdx, setActiveIdx] = React.useState(null);
    if (!history || history.length === 0) return null;
    const w = 560, h = 190;
    const padL = 36, padR = 14, padT = 48, padB = 28;
    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const maxKg = Math.ceil(Math.max(...history.map(p => p.kg)) / 6) * 6 || 6;
    const yTicks = [0, maxKg * 0.25, maxKg * 0.5, maxKg * 0.75, maxKg];
    const xFor = (i) => padL + (i / (history.length - 1 || 1)) * innerW;
    const yFor = (kg) => padT + innerH - (kg / maxKg) * innerH;
    const linePath = history.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p.kg).toFixed(1)}`).join(' ');
    const xLabels = history.map((p, i) => (i % 3 === 0 || i === history.length - 1 ? p.d : null));
    return (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#a5b4fc', textTransform: 'uppercase' }}>Exercise History</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
                    PR <span style={{ color: '#f0f0f0' }}>{pr} kg</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }} onClick={() => setActiveIdx(null)}>
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={padL} x2={w - padR} y1={yFor(t)} y2={yFor(t)} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                        <text x={padL - 6} y={yFor(t) + 3} textAnchor="end" style={{ fontSize: 9.5, fontWeight: 600, fill: '#555', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                            {t}kg
                        </text>
                    </g>
                ))}
                <path d={linePath} fill="none" stroke="#A5B4FC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                {history.map((p, i) => {
                    const isActive = activeIdx === i;
                    const isLast = i === history.length - 1;
                    const cx = xFor(i), cy = yFor(p.kg);
                    const kgLabel = `${p.kg} kg`;
                    const dateLabel = p.d;
                    const tipW = Math.max(kgLabel.length, dateLabel.length) * 7 + 20;
                    const tipX = Math.min(Math.max(cx - tipW / 2, padL), w - padR - tipW);
                    const tipY = cy - 50;
                    return (
                        <g key={i} onClick={(e) => { e.stopPropagation(); setActiveIdx(isActive ? null : i); }} style={{ cursor: 'pointer' }}>
                            <circle cx={cx} cy={cy} r={14} fill="transparent"/>
                            <circle cx={cx} cy={cy} r={isActive ? 5 : isLast ? 4 : 2.2}
                                fill={isActive ? '#fff' : isLast ? '#a5b4fc' : '#A5B4FC'}
                                stroke={isActive ? '#A5B4FC' : isLast ? '#000' : 'none'}
                                strokeWidth={isActive ? 2 : isLast ? 2 : 0}/>
                            {isActive && (
                                <g>
                                    <rect x={tipX} y={tipY} width={tipW} height={36} rx={8} fill="#1a1a2e" stroke="#A5B4FC" strokeWidth={1}/>
                                    <text x={tipX + tipW / 2} y={tipY + 14} textAnchor="middle" fill="#a5b4fc" fontSize={11} fontWeight={700}>{kgLabel}</text>
                                    <text x={tipX + tipW / 2} y={tipY + 28} textAnchor="middle" fill="#888" fontSize={10}>{dateLabel}</text>
                                </g>
                            )}
                        </g>
                    );
                })}
                {xLabels.map((label, i) => label && (
                    <text key={i} x={xFor(i)} y={h - 8} textAnchor="middle" style={{ fontSize: 9, fontWeight: 600, fill: '#555', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}>
                        {label}
                    </text>
                ))}
            </svg>
        </div>
    );
}

// ─── RestClockHorizontal ──────────────────────────────────────
function RestClockHorizontal({ elapsed = 0, onToggle, onReset, running }) {
    const radius = 26, stroke = 4, cx = 32, cy = 32;
    const circ = 2 * Math.PI * radius;
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const btn = {
        width: 26, height: 26, borderRadius: 6,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#888',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontFamily: 'inherit',
    };
    return (
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx={cx} cy={cy} r={radius} stroke={running ? 'rgba(165,180,252,0.35)' : 'rgba(255,255,255,0.06)'} strokeWidth={stroke} fill="none"/>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6"/>
                    </svg>
                </div>
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.18em', color: '#555', textTransform: 'uppercase' }}>Rest</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f0f0', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{mm}:{ss}</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                <button aria-label={running ? 'Pause' : 'Play'} style={btn} onClick={onToggle}>
                    {running
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
                </button>
                <button aria-label="Reset" style={btn} onClick={onReset}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                </button>
            </div>
        </div>
    );
}

// ─── Group Workout Tab ────────────────────────────────────────
const GroupWorkout = ({ activeTab, onTabChange }) => {
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const [groups,       setGroups]       = useState([]);
    const [selGroup,     setSelGroup]     = useState(null);
    const [programs,     setPrograms]     = useState([]);
    const [selProg,      setSelProg]      = useState(null);
    const [dayIdx,       setDayIdx]       = useState(todayIdx);
    const [logs,         setLogs]         = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [selectedEx,   setSelectedEx]   = useState(null);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [submitting,   setSubmitting]   = useState(false);
    const timerRef    = useRef(null);
    const startRef    = useRef(null); // wall-clock start timestamp
    const baseRef     = useRef(0);    // seconds already elapsed before last start

    const day = G_DAYS[dayIdx];

    useEffect(() => {
        if (timerRunning) {
            startRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
                setTimerSeconds(baseRef.current + elapsed);
            }, 500);
        } else {
            clearInterval(timerRef.current);
            baseRef.current = timerSeconds;
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    const toggleTimer = () => setTimerRunning(p => !p);
    const resetTimer  = () => { setTimerRunning(false); setTimerSeconds(0); baseRef.current = 0; };
    const formatTime  = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    useEffect(() => {
        axios.get('/api/v1/groups', { withCredentials: true })
            .then(res => { const g = res.data.data || []; setGroups(g); if (g.length > 0) setSelGroup(g[0]); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selGroup) return;
        setPrograms([]); setSelProg(null);
        axios.get(`/api/v1/groups/${selGroup.id}/programs`, { withCredentials: true })
            .then(async res => {
                const p = res.data.data || [];
                setPrograms(p);
                if (p.length > 0) {
                    const full = await axios.get(`/api/v1/groups/${selGroup.id}/programs/${p[0].id}`, { withCredentials: true });
                    setSelProg(full.data.data);
                }
            }).catch(() => {});
    }, [selGroup]);

    const selectProgram = async (prog) => {
        try {
            const full = await axios.get(`/api/v1/groups/${selGroup.id}/programs/${prog.id}`, { withCredentials: true });
            setSelProg(full.data.data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        if (!selGroup || !selProg) return;
        axios.get(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/logs`, { withCredentials: true })
            .then(res => setLogs(res.data.data || []))
            .catch(() => {});
    }, [selGroup, selProg]);

    const getMyLog = (exName) => logs.find(l => l.dayLabel === day && l.exerciseName === exName) || null;

    const openModal = (ex) => {
        const numSets = parseInt(ex.sets) || 3;
        const setsArr = Array.from({ length: numSets }, (_, i) => ({
            id: i + 1,
            kg: '',
            reps: '',
            targetKg: ex.weight || null,
            targetReps: ex.reps || null,
        }));
        setSelectedEx({ exName: ex.exerciseName || ex.name || 'Exercise', sets: setsArr });
        resetTimer();
    };

    const closeModal = () => { setSelectedEx(null); resetTimer(); };

    const handleSetChange = (setId, field, value) => {
        setSelectedEx(prev => ({ ...prev, sets: prev.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }));
    };

    const saveExercise = async () => {
        if (!selGroup || !selProg || !selectedEx) return;
        setSubmitting(true);
        try {
            await axios.post(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/log`, {
                dayLabel: day,
                exerciseName: selectedEx.exName,
                setsCompleted: selectedEx.sets.length,
                repsCompleted: selectedEx.sets[0]?.reps || null,
                weight: selectedEx.sets[0]?.kg || null,
            }, { withCredentials: true });
            const res = await axios.get(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/logs`, { withCredentials: true });
            setLogs(res.data.data || []);
        } catch { /* silent */ } finally { setSubmitting(false); closeModal(); }
    };

    if (loading) return <div className="gw-empty">Loading…</div>;
    if (groups.length === 0) return <div className="gw-empty">You are not in any group yet.</div>;
    if (programs.length === 0 && selGroup) return <div className="gw-empty">No program assigned to <strong>{selGroup.name}</strong> yet.</div>;

    const progData = (() => {
        if (!selProg?.programData) return [];
        try {
            const p = typeof selProg.programData === 'string' ? JSON.parse(selProg.programData) : selProg.programData;
            return Array.isArray(p) ? p : [];
        } catch { return []; }
    })();
    const exercises = progData.find(d => d.day === day)?.exercises || [];

    return (
        <div style={{
            background: '#0a0a0a', color: '#f0f0f0',
            fontFamily: "'Inter', system-ui, sans-serif",
            display: 'grid', gridTemplateColumns: '320px 1fr',
            minHeight: 600,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, overflow: 'hidden',
        }}>
            {/* ─── LEFT COLUMN ─── */}
            <div style={{
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 18px',
                display: 'flex', flexDirection: 'column', gap: 16,
            }}>
                {/* mini tab toggle */}
                <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 8, padding: 3, gap: 2 }}>
                    <button onClick={() => onTabChange('my')} style={{ flex: 1, padding: '5px 8px', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === 'my' ? '#fff' : 'transparent', color: activeTab === 'my' ? '#000' : '#666' }}>My Program</button>
                    <button onClick={() => onTabChange('group')} style={{ flex: 1, padding: '5px 8px', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === 'group' ? '#fff' : 'transparent', color: activeTab === 'group' ? '#000' : '#666' }}>Group</button>
                </div>

                {/* group tabs */}
                {groups.length > 1 && (
                    <div className="gw-group-tabs">
                        {groups.map(g => (
                            <button key={g.id} className={`gw-group-tab ${selGroup?.id === g.id ? 'active' : ''}`} onClick={() => setSelGroup(g)}>{g.name}</button>
                        ))}
                    </div>
                )}

                {/* day nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="workout-day-nav-btn" onClick={() => setDayIdx(i => (i + 6) % 7)}><ChevronLeft size={16} /></button>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#a5b4fc', textTransform: 'uppercase' }}>
                            {selProg?.name || 'Program'} · Day {dayIdx + 1}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{G_DAYS[dayIdx]}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
                                <span style={{ color: '#a5b4fc' }}>{logs.filter(l => l.dayLabel === G_DAYS[dayIdx]).length}</span> / {exercises.length}
                            </span>
                        </div>
                    </div>
                    <button className="workout-day-nav-btn" onClick={() => setDayIdx(i => (i + 1) % 7)}><ChevronRight size={16} /></button>
                </div>

                {/* progress bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginTop: -8 }}>
                    <div style={{
                        width: `${(logs.filter(l => l.dayLabel === G_DAYS[dayIdx]).length / Math.max(1, exercises.length)) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6d6aff, #a5b4fc)',
                    }}/>
                </div>

                {/* exercise list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {exercises.length === 0 ? (
                        <div className="gw-empty">Rest day — no exercises</div>
                    ) : exercises.map((ex, idx) => {
                        const exName = ex.exerciseName || ex.name || 'Exercise';
                        const myLog  = getMyLog(exName);
                        const done   = !!myLog;
                        const active = selectedEx?.exName === exName;
                        return (
                            <div key={idx}
                                onClick={() => openModal(ex)}
                                style={{
                                    display: 'grid', gridTemplateColumns: '28px 1fr auto',
                                    gap: 10, alignItems: 'center',
                                    padding: '10px',
                                    borderRadius: 8,
                                    background: active ? 'rgba(165,180,252,0.10)' : 'transparent',
                                    border: `1px solid ${active ? 'rgba(165,180,252,0.25)' : 'transparent'}`,
                                    cursor: 'pointer',
                                }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: active ? '#a5b4fc' : done ? '#555' : '#888', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                                    {String(idx + 1).padStart(2, '0')}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? '#888' : '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exName}</div>
                                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                                        {ex.sets} × {ex.reps || '—'}{ex.weight ? ` · ${ex.weight} kg` : ''}
                                    </div>
                                </div>
                                {done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                {!done && active && <svg width="11" height="11" viewBox="0 0 24 24" fill="#a5b4fc"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
                                {!done && !active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}/>}
                            </div>
                        );
                    })}
                </div>

                {/* rest clock pinned to bottom */}
                <RestClockHorizontal
                    elapsed={timerSeconds}
                    running={timerRunning}
                    onToggle={toggleTimer}
                    onReset={resetTimer}
                />
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <div style={{ padding: '24px 30px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!selectedEx ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, textAlign: 'center', padding: 32 }}>
                        {leftExercises.length === 0 ? (
                            <>
                                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', color: '#f0f0f0' }}>Rest Day</div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>No workout scheduled. Enjoy your recovery!</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: '#a5b4fc' }}>PICK AN EXERCISE</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>Tap a row on the left to start logging.</div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* title block */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', padding: '4px 8px', borderRadius: 6, background: 'rgba(165,180,252,0.18)', color: '#a5b4fc', whiteSpace: 'nowrap' }}>
                                    NEXT UP · DAY {dayIdx + 1}
                                </span>
                            </div>
                            <h1 style={{ margin: '12px 0 8px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                                {selectedEx.exName}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                                    {selectedEx.sets.length} × {selectedEx.sets[0]?.targetReps ?? '—'}
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#555' }}>@</span>
                                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#a5b4fc' }}>
                                    {selectedEx.sets[0]?.targetKg ?? '—'} kg
                                </span>
                            </div>
                        </div>

                        {/* sets table */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 28px', gap: 12, padding: '0 4px 4px', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', color: '#555', textTransform: 'uppercase' }}>
                                <div>Set</div><div style={{ textAlign: 'center' }}>Weight</div><div style={{ textAlign: 'center' }}>Reps</div><div/>
                            </div>
                            {selectedEx.sets.map(set => (
                                <div key={set.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 28px', gap: 12, alignItems: 'center', padding: '6px 4px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#555', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{set.id}</div>
                                    <CellInput
                                        value={set.kg}
                                        placeholder={set.targetKg ?? '-'}
                                        onChange={(v) => handleSetChange(set.id, 'kg', v)}
                                        onDoubleClick={() => { if (set.kg === '' && set.targetKg) handleSetChange(set.id, 'kg', String(set.targetKg)); }}
                                    />
                                    <CellInput
                                        value={set.reps}
                                        placeholder={set.targetReps ?? '-'}
                                        onChange={(v) => handleSetChange(set.id, 'reps', v)}
                                        onDoubleClick={() => { if (set.reps === '' && set.targetReps) handleSetChange(set.id, 'reps', String(set.targetReps)); }}
                                    />
                                    <SetDot filled={set.kg !== '' && set.reps !== ''} />
                                </div>
                            ))}
                        </div>

                        {/* history chart */}
                        <HistoryChart
                            history={
                                (logs || [])
                                    .filter(l => l.exerciseName === selectedEx.exName && l.weight)
                                    .map(l => ({ d: (l.completedAt || '').slice(5, 10), kg: Number(l.weight) }))
                            }
                            pr={Math.max(0, ...(logs || []).filter(l => l.exerciseName === selectedEx.exName && l.weight).map(l => Number(l.weight)))}
                        />

                        {/* save CTA */}
                        <button
                            disabled={submitting}
                            onClick={saveExercise}
                            style={{
                                width: '100%',
                                background: '#fff', color: '#0a0a0a',
                                border: 0, borderRadius: 12,
                                padding: '13px 0',
                                fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.6 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            {submitting ? 'Saving…' : 'Save & next exercise'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const Workout = () => {
    const [activeTab, setActiveTab] = useState('my');
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const timerRef  = useRef(null);
    const startRef2 = useRef(null);
    const baseRef2  = useRef(0);
    const [dayOffset, setDayOffset] = useState(0);
    const saveDebounceRef = useRef(null);

    // ─── Group state ──────────────────────────────────────────
    const todayGrpIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const [groups,         setGroups]         = useState([]);
    const [selGroup,       setSelGroup]       = useState(null);
    const [programs,       setPrograms]       = useState([]);
    const [selProg,        setSelProg]        = useState(null);
    const [groupDayIdx,    setGroupDayIdx]    = useState(todayGrpIdx);
    const [groupLogs,      setGroupLogs]      = useState([]);
    const [groupLoading,   setGroupLoading]   = useState(false);
    const [selectedEx,     setSelectedEx]     = useState(null);
    const [groupSubmitting,setGroupSubmitting]= useState(false);

    // Exercise history for My Program right pane
    const [exHistory,    setExHistory]    = useState([]);
    const [exHistoryPr,  setExHistoryPr]  = useState(0);

    useEffect(() => {
        if (activeTab === 'group' || !selectedExercise?.id) { setExHistory([]); setExHistoryPr(0); return; }
        axios.get(`/api/v1/stats/exercise-history/${selectedExercise.id}`, { withCredentials: true })
            .then(res => {
                const logs = res.data.data || [];
                const byDate = {};
                logs.forEach(l => {
                    if (!byDate[l.date]) byDate[l.date] = 0;
                    if (Number(l.kg) > byDate[l.date]) byDate[l.date] = Number(l.kg);
                });
                const points = Object.entries(byDate).map(([date, kg]) => ({ d: date.slice(5), kg }));
                const pr = points.reduce((m, p) => p.kg > m ? p.kg : m, 0);
                setExHistory(points);
                setExHistoryPr(pr);
            })
            .catch(() => { setExHistory([]); setExHistoryPr(0); });
    }, [selectedExercise?.id, activeTab]);

    // Timer logic — uses wall-clock so it keeps running when tab is inactive
    useEffect(() => {
        if (timerRunning) {
            startRef2.current = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startRef2.current) / 1000);
                setTimerSeconds(baseRef2.current + elapsed);
            }, 500);
        } else {
            clearInterval(timerRef.current);
            baseRef2.current = timerSeconds;
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    const toggleTimer = () => setTimerRunning(prev => !prev);
    const resetTimer = () => { setTimerRunning(false); setTimerSeconds(0); baseRef2.current = 0; };

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Compute the viewed date based on dayOffset
    const viewedDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        return d;
    }, [dayOffset]);

    const viewedDateStr = useMemo(() => {
        const d = viewedDate;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, [viewedDate]);
    const isToday = dayOffset === 0;

    const viewedDayName = useMemo(() => {
        const idx = viewedDate.getDay();
        return daysOfWeek[idx === 0 ? 6 : idx - 1];
    }, [viewedDate]);

    const viewedDayLabel = useMemo(() => {
        return viewedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }, [viewedDate]);

    useEffect(() => {
        const fetchWorkoutForDay = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/v1/workouts?date=${viewedDateStr}`, {
                    withCredentials: true
                });

                const workouts = response.data.data;
                const todayWorkout = workouts.find(w => w.day === viewedDayName);

                if (todayWorkout) {
                    const formattedExercises = todayWorkout.exercises.map(ex => {
                        const numSets = parseInt(ex.sets) || 3;
                        const targetReps = ex.reps || 10;
                        const savedLogs = ex.logs || [];

                        const setsArray = Array.from({ length: numSets }, (_, i) => {
                            const savedLog = savedLogs.find(l => l.setNumber === i + 1);
                            return {
                                id: i + 1,
                                kg: savedLog ? String(savedLog.kg) : '',
                                reps: savedLog ? String(savedLog.reps) : '',
                                targetKg: ex.weight,
                                targetReps: targetReps,
                                completed: savedLog ? true : false
                            };
                        });

                        return {
                            id: ex.exerciseId || Math.random().toString(),
                            workoutExerciseId: ex.workoutExerciseId,
                            name: ex.exerciseName,
                            sets: setsArray,
                            tip: "",
                            notes: ex.notes || ""
                        };
                    });

                    setWorkout({
                        id: todayWorkout.id,
                        name: todayWorkout.name,
                        exercises: formattedExercises
                    });
                    if (formattedExercises.length > 0) setSelectedExercise(formattedExercises[0]);
                } else {
                    setWorkout(null);
                }
            } catch (error) {
                console.error("Error fetching workout:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkoutForDay();
    }, [dayOffset, viewedDateStr, viewedDayName]);

    // Modal Handlers
    const openExerciseModal = (exercise) => {
        setSelectedExercise(exercise);
    };

    const closeExerciseModal = () => {
        setSelectedExercise(null);
        resetTimer();
    };

    const handleSetChange = (setId, field, value) => {
        if (!selectedExercise) return;

        const updatedSets = selectedExercise.sets.map(set => {
            if (set.id !== setId) return set;
            const updated = { ...set, [field]: value };
            updated.completed = updated.kg !== '' && updated.reps !== '';
            return updated;
        });

        const updatedExercise = { ...selectedExercise, sets: updatedSets };
        setSelectedExercise(updatedExercise);

        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id !== selectedExercise.id ? ex : { ...ex, sets: updatedSets }
            )
        }));

        // Debounced auto-save — fires 800ms after last keystroke
        clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = setTimeout(async () => {
            try {
                await axios.post('/api/v1/workouts/logs', {
                    workoutExerciseId: updatedExercise.workoutExerciseId,
                    sets: updatedSets.map(s => ({ setNumber: s.id, kg: s.kg, reps: s.reps }))
                }, { withCredentials: true });
            } catch { /* silent */ }
        }, 800);
    };

    const saveExercise = async () => {
        const updatedExercise = {
            ...selectedExercise,
            sets: selectedExercise.sets.map(set => ({
                ...set,
                completed: set.kg !== '' && set.reps !== ''
            }))
        };
        const updatedExercises = workout.exercises.map(ex =>
            ex.id === updatedExercise.id ? updatedExercise : ex
        );
        setWorkout({ ...workout, exercises: updatedExercises });
        closeExerciseModal();

        try {
            await axios.post('/api/v1/workouts/logs', {
                workoutExerciseId: updatedExercise.workoutExerciseId,
                sets: updatedExercise.sets.map(set => ({
                    setNumber: set.id,
                    kg: set.kg,
                    reps: set.reps
                }))
            }, { withCredentials: true });
        } catch (error) {
            console.error('Error saving workout logs:', error);
        }
    };




    // ─── Group effects ────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'group') return;
        setGroupLoading(true);
        axios.get('/api/v1/groups', { withCredentials: true })
            .then(res => { const g = res.data.data || []; setGroups(g); if (g.length > 0) setSelGroup(g[0]); })
            .catch(() => {})
            .finally(() => setGroupLoading(false));
    }, [activeTab]);

    useEffect(() => {
        if (!selGroup) return;
        setPrograms([]); setSelProg(null);
        axios.get(`/api/v1/groups/${selGroup.id}/programs`, { withCredentials: true })
            .then(async res => {
                const p = res.data.data || [];
                setPrograms(p);
                if (p.length > 0) {
                    const full = await axios.get(`/api/v1/groups/${selGroup.id}/programs/${p[0].id}`, { withCredentials: true });
                    setSelProg(full.data.data);
                }
            }).catch(() => {});
    }, [selGroup]);

    useEffect(() => {
        if (!selGroup || !selProg) return;
        axios.get(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/logs`, { withCredentials: true })
            .then(res => setGroupLogs(res.data.data || []))
            .catch(() => {});
    }, [selGroup, selProg]);

    // ─── Group computed ───────────────────────────────────────
    const grpDay = G_DAYS[groupDayIdx];
    const groupExercises = useMemo(() => {
        if (!selProg?.programData) return [];
        try {
            const p = typeof selProg.programData === 'string' ? JSON.parse(selProg.programData) : selProg.programData;
            return Array.isArray(p) ? (p.find(d => d.day === grpDay)?.exercises || []) : [];
        } catch { return []; }
    }, [selProg, grpDay]);

    // ─── Group functions ──────────────────────────────────────
    const getGroupLog = (exName) => groupLogs.find(l => l.dayLabel === grpDay && l.exerciseName === exName) || null;

    const openGroupModal = (ex) => {
        const numSets = parseInt(ex.sets) || 3;
        setSelectedEx({ exName: ex.exerciseName || ex.name || 'Exercise', sets: Array.from({ length: numSets }, (_, i) => ({ id: i + 1, kg: '', reps: '', targetKg: ex.weight || null, targetReps: ex.reps || null })) });
        resetTimer();
    };

    const handleGroupSetChange = (setId, field, value) => {
        setSelectedEx(prev => ({ ...prev, sets: prev.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }));
    };

    const saveGroupExercise = async () => {
        if (!selGroup || !selProg || !selectedEx) return;
        setGroupSubmitting(true);
        try {
            await axios.post(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/log`, {
                dayLabel: grpDay, exerciseName: selectedEx.exName,
                setsCompleted: selectedEx.sets.length,
                repsCompleted: selectedEx.sets[0]?.reps || null,
                weight: selectedEx.sets[0]?.kg || null,
            }, { withCredentials: true });
            const res = await axios.get(`/api/v1/groups/${selGroup.id}/programs/${selProg.id}/logs`, { withCredentials: true });
            setGroupLogs(res.data.data || []);
        } catch { /* silent */ }
        setGroupSubmitting(false);
        setSelectedEx(null);
        resetTimer();
    };

    // ─── Unified render ───────────────────────────────────────
    const isGroup = activeTab === 'group';

    const navLabel   = isGroup ? G_DAYS[groupDayIdx] : viewedDayLabel;
    const navPrev    = isGroup ? () => setGroupDayIdx(i => (i + 6) % 7) : () => setDayOffset(p => p - 1);
    const navNext    = isGroup ? () => setGroupDayIdx(i => (i + 1) % 7) : () => setDayOffset(p => p + 1);

    const leftExercises = isGroup ? groupExercises : (workout?.exercises || []);
    const leftLoading   = isGroup ? groupLoading : loading;
    const leftEmpty     = isGroup
        ? (groups.length === 0 ? 'You are not in any group yet.' : programs.length === 0 ? 'No program assigned yet.' : groupExercises.length === 0 ? 'Rest day — no exercises' : null)
        : (!workout ? (isToday ? 'No workout scheduled for today.' : `No workout scheduled for ${viewedDayName}.`) : null);

    const doneCount  = isGroup ? groupLogs.filter(l => l.dayLabel === grpDay).length : leftExercises.filter(e => e.sets?.every(s => s.completed)).length;
    const totalCount = leftExercises.length;

    const activeSelected = isGroup ? selectedEx : selectedExercise;
    const activeSets     = isGroup ? selectedEx?.sets : selectedExercise?.sets;
    const activeName     = isGroup ? selectedEx?.exName : selectedExercise?.name;
    const activeProgName = isGroup ? (selProg?.name || 'Group') : (workout?.name || 'Program');
    const activeDayNum   = isGroup ? groupDayIdx + 1 : daysOfWeek.indexOf(viewedDayName) + 1;
    const canEdit        = isGroup || isToday;

    const onSetChange = (setId, field, v) => isGroup ? handleGroupSetChange(setId, field, v) : handleSetChange(setId, field, v);
    const onRowClick  = (ex) => isGroup ? openGroupModal(ex) : openExerciseModal(ex);

    const renderRow = (ex, idx) => {
        const exName = isGroup ? (ex.exerciseName || ex.name || 'Exercise') : ex.name;
        const done   = isGroup ? !!getGroupLog(exName) : ex.sets?.every(s => s.completed);
        const active = isGroup ? selectedEx?.exName === exName : selectedExercise?.id === ex.id;
        const meta   = isGroup
            ? `${ex.sets} × ${ex.reps || '—'}${ex.weight ? ` · ${ex.weight} kg` : ''}`
            : `${ex.sets?.length} × ${ex.sets?.[0]?.targetReps || '—'}${ex.sets?.[0]?.targetKg ? ` · ${ex.sets[0].targetKg} kg` : ''}`;
        return (
            <div key={isGroup ? idx : ex.id} onClick={() => onRowClick(ex)}
                style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '10px', borderRadius: 8, background: active ? 'rgba(165,180,252,0.10)' : 'transparent', border: `1px solid ${active ? 'rgba(165,180,252,0.25)' : 'transparent'}`, cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: active ? '#a5b4fc' : done ? '#555' : '#888', fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>{String(idx + 1).padStart(2, '0')}</div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? '#888' : '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exName}</div>
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{meta}</div>
                </div>
                {done  && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {!done && active  && <svg width="11" height="11" viewBox="0 0 24 24" fill="#a5b4fc"><polygon points="6 4 20 12 6 20 6 4"/></svg>}
                {!done && !active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }}/>}
            </div>
        );
    };

    const rightPane = !activeSelected ? (
        leftExercises.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: '#a5b4fc' }}>PICK AN EXERCISE</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>Tap a row on the left to start logging.</div>
            </div>
        ) : null
    ) : (
        <>
            <div>
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', padding: '4px 8px', borderRadius: 6, background: 'rgba(165,180,252,0.18)', color: '#a5b4fc' }}>
                    {activeProgName} · DAY {activeDayNum}
                </span>
                {!canEdit && <span style={{ fontSize: 10, fontWeight: 700, color: '#555', marginLeft: 8 }}>read only</span>}
                {canEdit && <span style={{ fontSize: 10, fontWeight: 600, color: '#555', marginLeft: 8 }}>double-tap a field to fill target</span>}
            </div>
            <h1 style={{ margin: '4px 0 8px', fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05 }}>{activeName}</h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{activeSets?.length} × {activeSets?.[0]?.targetReps ?? '—'}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#555' }}>@</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#a5b4fc' }}>{activeSets?.[0]?.targetKg ?? '—'} kg</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 28px', gap: 12, padding: '0 4px 4px', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', color: '#555', textTransform: 'uppercase', position: 'sticky', top: 0, background: '#0a0a0a' }}>
                    <div>Set</div><div style={{ textAlign: 'center' }}>Weight</div><div style={{ textAlign: 'center' }}>Reps</div><div/>
                </div>
                {activeSets?.map(set => (
                    <div key={set.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 28px', gap: 12, alignItems: 'center', padding: '6px 4px' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#555', textAlign: 'center' }}>{set.id}</div>
                        <CellInput value={set.kg} placeholder={set.targetKg ?? '-'}
                            onChange={(v) => canEdit && onSetChange(set.id, 'kg', v)}
                            onDoubleClick={() => { if (canEdit && set.kg === '' && set.targetKg) onSetChange(set.id, 'kg', String(set.targetKg)); }} />
                        <CellInput value={set.reps} placeholder={set.targetReps ?? '-'}
                            onChange={(v) => canEdit && onSetChange(set.id, 'reps', v)}
                            onDoubleClick={() => { if (canEdit && set.reps === '' && set.targetReps) onSetChange(set.id, 'reps', String(set.targetReps)); }} />
                        <SetDot filled={set.kg !== '' && set.reps !== ''} />
                    </div>
                ))}
            </div>
            <HistoryChart
                history={isGroup
                    ? (groupLogs || []).filter(l => l.exerciseName === selectedEx?.exName && l.weight).map(l => ({ d: (l.completedAt || '').slice(5, 10), kg: Number(l.weight) }))
                    : exHistory}
                pr={isGroup
                    ? Math.max(0, ...(groupLogs || []).filter(l => l.exerciseName === selectedEx?.exName && l.weight).map(l => Number(l.weight)))
                    : exHistoryPr}
            />
            {isGroup && canEdit && (
                <button disabled={groupSubmitting} onClick={saveGroupExercise}
                    style={{ width: '100%', background: '#fff', color: '#0a0a0a', border: 0, borderRadius: 12, padding: '13px 0', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {groupSubmitting ? 'Saving…' : 'Save & next exercise'}
                </button>
            )}
        </>
    );

    return (
        <div className="workout-container" style={{ width: '100%', height: 'calc(100vh - 118px)', minHeight: 500 }}>
            <div style={{ background: '#0a0a0a', color: '#f0f0f0', fontFamily: "'Inter', system-ui, sans-serif", display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                {/* LEFT */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* mini tab toggle */}
                    <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 8, padding: 3, gap: 2 }}>
                        <button onClick={() => { setActiveTab('my'); setSelectedEx(null); setSelectedExercise(workout?.exercises?.[0] || null); }} style={{ flex: 1, padding: '5px 8px', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: !isGroup ? '#fff' : 'transparent', color: !isGroup ? '#000' : '#666' }}>My Program</button>
                        <button onClick={() => { setActiveTab('group'); setSelectedExercise(null); }} style={{ flex: 1, padding: '5px 8px', border: 'none', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: isGroup ? '#fff' : 'transparent', color: isGroup ? '#000' : '#666' }}>Group</button>
                    </div>
                    {/* day nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="workout-day-nav-btn" onClick={navPrev}><ChevronLeft size={16} /></button>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{navLabel}</div>
                            {!isGroup && !isToday && <button onClick={() => setDayOffset(0)} style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>Today</button>}
                        </div>
                        <button className="workout-day-nav-btn" onClick={navNext}><ChevronRight size={16} /></button>
                    </div>
                    {/* progress */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6 }}>
                            <span>{isGroup ? grpDay : (isToday ? 'Today' : viewedDayName)}</span>
                            <span><span style={{ color: '#a5b4fc' }}>{doneCount}</span> / {totalCount}</span>
                        </div>
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${(doneCount / Math.max(1, totalCount)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6d6aff, #a5b4fc)' }}/>
                        </div>
                    </div>
                    {/* exercise list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        {leftLoading ? (
                            <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Loading…</div>
                        ) : leftEmpty ? (
                            <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>{leftEmpty}</div>
                        ) : leftExercises.map((ex, idx) => renderRow(ex, idx))}
                    </div>
                    <RestClockHorizontal elapsed={timerSeconds} running={timerRunning} onToggle={toggleTimer} onReset={resetTimer} />
                </div>
                {/* RIGHT */}
                <div style={{ padding: '24px 30px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                    {rightPane}
                </div>
            </div>
        </div>
    );
};

export default Workout;
