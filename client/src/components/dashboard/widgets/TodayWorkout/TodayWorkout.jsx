import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import './TodayWorkout.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TodayWorkout = ({ onNavigate }) => {
    const [workout, setWorkout]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [logged, setLogged]     = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const today = DAYS[new Date().getDay()];
                const res = await axios.get('/api/v1/workouts', { withCredentials: true });
                const workouts = res.data.data || [];
                const todayW = workouts.find(w => w.day === today);
                if (todayW) {
                    setWorkout(todayW);
                    // Check if logged today
                    const logRes = await axios.get(`/api/v1/workout/${todayW.id}/logs?date=${new Date().toISOString().split('T')[0]}`, { withCredentials: true });
                    const logs = logRes.data.data || [];
                    if (logs.length > 0) setLogged(true);
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch();
    }, []);

    const exerciseCount = workout?.exercises?.length || 0;

    return (
        <div className="tw-container">
            <div className="tw-header">
                <h3 className="tw-title">Today's Workout</h3>
            </div>

            {loading ? (
                <div className="tw-loading"><div className="tw-spinner" /></div>
            ) : !workout ? (
                <div className="tw-rest">
                    <div className="tw-rest-icon">
                        <Clock size={36} />
                    </div>
                    <p className="tw-rest-text">Rest Day</p>
                    <span className="tw-rest-sub">No workout scheduled for today. Enjoy your recovery!</span>
                </div>
            ) : (
                <div className="tw-body">
                    <div className="tw-name-row">
                        <span className="tw-workout-name">{workout.name}</span>
                        {logged && (
                            <span className="tw-done-badge">
                                <CheckCircle2 size={14} /> Done
                            </span>
                        )}
                    </div>

                    <div className="tw-stats-row">
                        <div className="tw-stat">
                            <span className="tw-stat-value">{exerciseCount}</span>
                            <span className="tw-stat-label">Exercises</span>
                        </div>
                        <div className="tw-stat">
                            <span className="tw-stat-value">{workout.exercises?.reduce((s, e) => s + (parseInt(e.sets) || 3), 0) || 0}</span>
                            <span className="tw-stat-label">Total Sets</span>
                        </div>
                    </div>

                    {exerciseCount > 0 && (
                        <div className="tw-exercises">
                            {workout.exercises.slice(0, 5).map((ex, i) => (
                                <div key={i} className="tw-exercise">
                                    <span className="tw-ex-num">{i + 1}</span>
                                    <span className="tw-ex-name">{ex.exerciseName}</span>
                                    <span className="tw-ex-detail">
                                        {ex.sets || 3}x{ex.reps || '—'}
                                        {ex.weight ? ` @ ${ex.weight}kg` : ''}
                                    </span>
                                </div>
                            ))}
                            {exerciseCount > 5 && (
                                <div className="tw-more">+{exerciseCount - 5} more</div>
                            )}
                        </div>
                    )}

                    <button className="tw-start-btn" onClick={() => onNavigate('workout')}>
                        <Play size={16} />
                        {logged ? 'View Workout' : 'Start Workout'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TodayWorkout;
