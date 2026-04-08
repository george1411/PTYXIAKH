import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle, Play, Pause, RotateCcw, Timer } from 'lucide-react';
import axios from 'axios';
import './Workout.css';

const Workout = () => {
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

        const updatedSets = selectedExercise.sets.map(set =>
            set.id === setId ? { ...set, [field]: value } : set
        );

        setSelectedExercise({ ...selectedExercise, sets: updatedSets });
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

        // Persist to database
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



    if (loading) {
        return (
            <div className="workout-container max-w-4xl mx-auto w-full p-4">
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

            {/* Header */}
            <div className="workout-header-row">
                <div className="workout-header-title">
                    <span>Exercise List</span>
                </div>
                <div className="workout-header-info">
                    {workout.exercises.length} Exercises <span className="mx-2">|</span> {workout.name}
                </div>
            </div>

            {/* List */}
            {/* List - Redesigned as Cards */}
            {/* List - Reverted to Row Style */}
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
                                {exercise.sets.length} Sets
                                {exercise.tip && " • Tip available"}
                            </span>
                        </div>

                        {/* Right side: Either previews or Log button */}
                        <div className="sets-preview">
                            {exercise.sets.some(s => s.completed) ? (
                                exercise.sets.map((set, idx) => (
                                    <div key={idx} className={`set-pill-preview ${set.completed ? 'completed' : ''}`}>
                                        <span>Set {set.id}</span>
                                        {set.completed && <span>{set.kg}kg × {set.reps}</span>}
                                    </div>
                                ))
                            ) : isToday ? (
                                <button className="btn-log-exercise" onClick={(e) => {
                                    e.stopPropagation();
                                    openExerciseModal(exercise);
                                }}>
                                    Log
                                </button>
                            ) : (
                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Not logged</span>
                            )}
                        </div>
                    </div>
                ))}
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
                                    <span className="workout-trainer-target-label">Trainer target:</span>
                                    <span className="workout-trainer-target-value">
                                        {selectedExercise.sets.length} sets
                                        {selectedExercise.sets[0]?.targetReps ? ` × ${selectedExercise.sets[0].targetReps} reps` : ''}
                                        {selectedExercise.sets[0]?.targetKg ? ` @ ${selectedExercise.sets[0].targetKg} kg` : ''}
                                    </span>
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
                                        placeholder={set.targetKg ? String(set.targetKg) : '-'}
                                    />
                                    <input
                                        type="number"
                                        className="workout-input"
                                        value={set.reps}
                                        onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)}
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
