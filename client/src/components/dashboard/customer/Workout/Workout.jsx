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
                background: filled ? 'rgba(129,140,248,0.18)' : 'transparent',
                border: `1.5px solid ${filled ? '#818CF8' : 'rgba(255,255,255,0.18)'}`,
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

// ─── Group Workout Tab ────────────────────────────────────────
const GroupWorkout = () => {
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
    const timerRef = useRef(null);

    const day = G_DAYS[dayIdx];

    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    const toggleTimer = () => setTimerRunning(p => !p);
    const resetTimer  = () => { setTimerRunning(false); setTimerSeconds(0); };
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
        <div className="gw-container">
            {groups.length > 1 && (
                <div className="gw-group-tabs">
                    {groups.map(g => (
                        <button key={g.id} className={`gw-group-tab ${selGroup?.id === g.id ? 'active' : ''}`} onClick={() => setSelGroup(g)}>{g.name}</button>
                    ))}
                </div>
            )}
            {programs.length > 1 && (
                <div className="gw-prog-tabs">
                    {programs.map(p => (
                        <button key={p.id} className={`gw-prog-tab ${selProg?.id === p.id ? 'active' : ''}`} onClick={() => selectProgram(p)}>{p.name}</button>
                    ))}
                </div>
            )}
            {/* Day navigation — same as My Program */}
            <div className="workout-day-nav">
                <button className="workout-day-nav-btn" onClick={() => setDayIdx(i => (i + 6) % 7)}><ChevronLeft size={18} /></button>
                <span className="workout-day-nav-label">{(() => {
                    const d = new Date();
                    const todayDayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
                    const diff = dayIdx - todayDayIdx;
                    d.setDate(d.getDate() + diff);
                    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                })()}</span>
                <button className="workout-day-nav-btn" onClick={() => setDayIdx(i => (i + 1) % 7)}><ChevronRight size={18} /></button>
            </div>

            {/* Header + Exercise rows merged */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="workout-header-row">
                <div className="workout-header-title"><span>Exercise List</span></div>
                <div className="workout-header-info">{exercises.length} Exercises <span className="mx-2">|</span> {selProg?.name}</div>
            </div>

            <div className="exercise-list custom-scrollbar" style={{ borderRadius: 0 }}>
                {exercises.length === 0 ? (
                    <div className="gw-empty">Rest day — no exercises</div>
                ) : exercises.map((ex, idx) => {
                    const exName = ex.exerciseName || ex.name || 'Exercise';
                    const myLog  = getMyLog(exName);
                    return (
                        <div key={idx} className="exercise-row" onClick={() => openModal(ex)}>
                            <div className="exercise-details">
                                <h3 className="exercise-name">{exName}</h3>
                                <span className="exercise-meta">{ex.sets} Sets</span>
                            </div>
                            <div className="sets-preview">
                                {myLog ? (
                                    <div className="set-pill-preview completed">
                                        <span>Logged</span>
                                        <span>{myLog.setsCompleted}×{myLog.repsCompleted}{myLog.weight ? ` @ ${myLog.weight}kg` : ''}</span>
                                    </div>
                                ) : (
                                    <button className="btn-log-exercise" onClick={e => { e.stopPropagation(); openModal(ex); }}>Log</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>

            {/* Modal — same as My Program */}
            {selectedEx && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <h2>{selectedEx.exName}</h2>
                                <span className="modal-subtitle">{selProg?.name}</span>
                            </div>
                            <X className="modal-close-btn w-6 h-6" onClick={closeModal} />
                        </div>
                        <div className="modal-body custom-scrollbar">
                            {(selectedEx.sets[0]?.targetReps || selectedEx.sets[0]?.targetKg) && (
                                <div className="workout-trainer-target">
                                    <div className="workout-trainer-target-row">
                                        <span className="workout-trainer-target-label">Trainer target:</span>
                                        <span className="workout-trainer-target-value">
                                            {selectedEx.sets.length} sets
                                            {selectedEx.sets[0]?.targetReps ? ` × ${selectedEx.sets[0].targetReps} reps` : ''}
                                            {selectedEx.sets[0]?.targetKg ? ` @ ${selectedEx.sets[0].targetKg} kg` : ''}
                                        </span>
                                    </div>
                                    <div className="workout-double-tap-hint">Double-tap a field to fill</div>
                                </div>
                            )}
                            <div className="sets-header"><span>#</span><span>KG</span><span>REPS</span></div>

                            {selectedEx.sets.map(set => (
                                <div key={set.id} className="set-row">
                                    <div className="set-number">{set.id}</div>
                                    <input type="number" className="workout-input" value={set.kg}
                                        onChange={e => handleSetChange(set.id, 'kg', e.target.value)}
                                        onDoubleClick={() => { if (set.kg === '' && set.targetKg) handleSetChange(set.id, 'kg', String(set.targetKg)); }}
                                        placeholder={set.targetKg ? String(set.targetKg) : '-'} />
                                    <input type="number" className="workout-input" value={set.reps}
                                        onChange={e => handleSetChange(set.id, 'reps', e.target.value)}
                                        onDoubleClick={() => { if (set.reps === '' && set.targetReps) handleSetChange(set.id, 'reps', String(set.targetReps)); }}
                                        placeholder={set.targetReps ? String(set.targetReps) : '-'} />
                                </div>
                            ))}
                            <div className="rest-timer-section">
                                <div className="rest-timer-label"><Timer className="w-4 h-4" /><span>REST TIMER</span></div>
                                <div className="rest-timer-display">
                                    <span className={`rest-timer-time ${timerRunning ? 'active' : ''}`}>{formatTime(timerSeconds)}</span>
                                    <div className="rest-timer-controls">
                                        <button className="rest-timer-btn" onClick={toggleTimer}>
                                            {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </button>
                                        <button className="rest-timer-btn reset" onClick={resetTimer}><RotateCcw className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-save-primary" disabled={submitting} onClick={saveExercise}>
                                <CheckCircle className="w-5 h-5" />
                                {submitting ? 'Saving…' : 'Save & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    const timerRef = useRef(null);
    const [dayOffset, setDayOffset] = useState(0);

    // Timer logic
    useEffect(() => {
        if (timerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerRunning]);

    const toggleTimer = () => setTimerRunning(prev => !prev);
    const resetTimer = () => { setTimerRunning(false); setTimerSeconds(0); };

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

        setSelectedExercise({ ...selectedExercise, sets: updatedSets });

        // Keep dots in list in sync live
        setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id !== selectedExercise.id ? ex : { ...ex, sets: updatedSets }
            )
        }));
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




    const tabBar = (
        <div className="workout-tab-bar">
            <button className={`workout-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Program</button>
            <button className={`workout-tab-btn ${activeTab === 'group' ? 'active' : ''}`} onClick={() => setActiveTab('group')}>Group</button>
        </div>
    );

    if (activeTab === 'group') {
        return (
            <div className="workout-container max-w-4xl mx-auto w-full p-4">
                {tabBar}
                <GroupWorkout />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="workout-container max-w-4xl mx-auto w-full p-4">
                {tabBar}
                <div className="workout-day-nav">
                    <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev - 1)}><ChevronLeft size={18} /></button>
                    <span className="workout-day-nav-label">{viewedDayLabel}</span>
                    <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev + 1)}><ChevronRight size={18} /></button>
                    {!isToday && <button className="workout-day-today-btn" onClick={() => setDayOffset(0)}>Today</button>}
                </div>
                <div className="p-8 text-center" style={{ color: '#555' }}>Loading workout...</div>
            </div>
        );
    }

    if (!workout) {
        return (
            <div className="workout-container max-w-4xl mx-auto w-full p-4">
                {tabBar}
                <div className="workout-day-nav">
                    <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev - 1)}><ChevronLeft size={18} /></button>
                    <span className="workout-day-nav-label">{viewedDayLabel}</span>
                    <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev + 1)}><ChevronRight size={18} /></button>
                    {!isToday && <button className="workout-day-today-btn" onClick={() => setDayOffset(0)}>Today</button>}
                </div>
                <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
                    <div className="p-6 rounded-full mb-4" style={{ background: '#1a1a1a' }}>
                        <Info className="w-8 h-8" style={{ color: '#555' }} />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#e0e0e0' }}>Rest Day</h2>
                    <p style={{ color: '#666' }}>
                        {isToday ? 'No workout scheduled for today.' : `No workout scheduled for ${viewedDayName}.`}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="workout-container max-w-4xl mx-auto w-full p-4">
            {tabBar}

            {/* Day Navigation */}
            <div className="workout-day-nav">
                <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev - 1)}><ChevronLeft size={18} /></button>
                <span className="workout-day-nav-label">{viewedDayLabel}</span>
                <button className="workout-day-nav-btn" onClick={() => setDayOffset(prev => prev + 1)}><ChevronRight size={18} /></button>
                {!isToday && <button className="workout-day-today-btn" onClick={() => setDayOffset(0)}>Today</button>}
            </div>

            {/* Past day banner */}
            {!isToday && (
                <div className="workout-past-banner">
                    <Info size={16} />
                    <span>Viewing {viewedDayName}'s workout — read only</span>
                </div>
            )}

            {/* Exercise board */}
            <div className="exercise-board">
                <div className="exercise-board-header">
                    <span className="exercise-board-title">EXERCISE LIST</span>
                    <span className="exercise-board-count">
                        {workout.exercises.filter(e => e.sets.every(s => s.completed)).length} / {workout.exercises.length} LOGGED
                    </span>
                </div>

                <div className="exercise-list custom-scrollbar">
                    {workout.exercises.map((exercise) => (
                        <div
                            key={exercise.id}
                            className={`exercise-row ${!isToday ? 'read-only' : ''}`}
                            onClick={() => isToday && openExerciseModal(exercise)}
                        >
                            <div className="exercise-details">
                                <h3 className="exercise-name">{exercise.name}</h3>
                                <span className="exercise-meta">
                                    {exercise.sets[0]?.targetReps ? `${exercise.sets[0].targetReps} reps` : `${exercise.sets.length} sets`}
                                    {exercise.sets[0]?.targetKg ? ` · ${exercise.sets[0].targetKg} kg` : ''}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {exercise.sets.map((set, i) => (
                                    <SetDot
                                        key={i}
                                        filled={set.completed}
                                        ariaLabel={`Set ${i + 1} of ${exercise.sets.length} for ${exercise.name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {selectedExercise && (
                <div className="modal-overlay" onClick={closeExerciseModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-group">
                                <h2>{selectedExercise.name}</h2>
                                <span className="modal-subtitle">{workout.name}</span>
                            </div>
                            <X className="modal-close-btn w-6 h-6" onClick={closeExerciseModal} />
                        </div>

                        <div className="modal-body custom-scrollbar">
                            {/* Trainer target hint */}
                            {(selectedExercise.sets[0]?.targetReps || selectedExercise.sets[0]?.targetKg) && (
                                <div className="workout-trainer-target">
                                    <div className="workout-trainer-target-row">
                                        <span className="workout-trainer-target-label">Trainer target:</span>
                                        <span className="workout-trainer-target-value">
                                            {selectedExercise.sets.length} sets
                                            {selectedExercise.sets[0]?.targetReps ? ` × ${selectedExercise.sets[0].targetReps} reps` : ''}
                                            {selectedExercise.sets[0]?.targetKg ? ` @ ${selectedExercise.sets[0].targetKg} kg` : ''}
                                        </span>
                                    </div>
                                    <div className="workout-double-tap-hint">Double-tap a field to fill</div>
                                </div>
                            )}

                            <div className="sets-header">
                                <span>#</span>
                                <span>KG</span>
                                <span>REPS</span>
                            </div>


                            {selectedExercise.sets.map((set) => (
                                <div key={set.id} className="set-row">
                                    <div className="set-number">{set.id}</div>
                                    <input
                                        type="number"
                                        className="workout-input"
                                        value={set.kg}
                                        onChange={(e) => handleSetChange(set.id, 'kg', e.target.value)}
                                        onDoubleClick={() => { if (set.kg === '' && set.targetKg) handleSetChange(set.id, 'kg', String(set.targetKg)); }}
                                        placeholder={set.targetKg ? String(set.targetKg) : '-'}
                                    />
                                    <input
                                        type="number"
                                        className="workout-input"
                                        value={set.reps}
                                        onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)}
                                        onDoubleClick={() => { if (set.reps === '' && set.targetReps) handleSetChange(set.id, 'reps', String(set.targetReps)); }}
                                        placeholder={set.targetReps ? String(set.targetReps) : '-'}
                                    />
                                </div>
                            ))}

                            {/* Rest Timer */}
                            <div className="rest-timer-section">
                                <div className="rest-timer-label">
                                    <Timer className="w-4 h-4" />
                                    <span>REST TIMER</span>
                                </div>
                                <div className="rest-timer-display">
                                    <span className={`rest-timer-time ${timerRunning ? 'active' : ''}`}>
                                        {formatTime(timerSeconds)}
                                    </span>
                                    <div className="rest-timer-controls">
                                        <button className="rest-timer-btn" onClick={toggleTimer}>
                                            {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </button>
                                        <button className="rest-timer-btn reset" onClick={resetTimer}>
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {selectedExercise.tip && (
                                <div className="tip-box">
                                    <div className="tip-title">
                                        <Info className="w-4 h-4" />
                                        <span>Form Tip</span>
                                    </div>
                                    <p className="tip-text">{selectedExercise.tip}</p>
                                </div>
                            )}

                        </div>

                        <div className="modal-footer">
                            <button className="btn-save-primary" onClick={saveExercise}>
                                <CheckCircle className="w-5 h-5" />
                                Save & Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workout;
