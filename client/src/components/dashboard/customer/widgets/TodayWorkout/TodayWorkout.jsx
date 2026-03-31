import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import './TodayWorkout.css';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TodayWorkout = ({ onNavigate }) => {
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logged, setLogged]   = useState(false);

    const today      = DAYS[new Date().getDay()];
    const todayUpper = today.toUpperCase();
    const todayDate  = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get('/api/v1/workouts', { withCredentials: true });
                const workouts = res.data.data || [];
                const todayW = workouts.find(w => w.day === today);
                if (todayW) {
                    setWorkout(todayW);
                    const logRes = await axios.get(
                        `/api/v1/workout/${todayW.id}/logs?date=${todayDate}`,
                        { withCredentials: true }
                    );
                    if ((logRes.data.data || []).length > 0) setLogged(true);
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch();
    }, []);

    return (
        <div className="tw-container">
            {loading ? (
                <div className="tw-loading"><div className="tw-spinner" /></div>
            ) : !workout ? (
                <>
                    <div className="tw-top-row">
                        <h2 className="tw-workout-title">Today's Workout</h2>
                    </div>
                    <div className="tw-divider" />
                    <div className="tw-rest">
                        <Clock size={36} />
                        <p className="tw-rest-text">Rest Day</p>
                        <span className="tw-rest-sub">No workout scheduled. Enjoy your recovery!</span>
                    </div>
                </>
            ) : (
                <>
                    <div className="tw-top-row">
                        <span className="tw-day-label">TODAY'S WORKOUT</span>
                        {logged && <span className="tw-done-badge"><CheckCircle2 size={13} /> Done</span>}
                    </div>

                    <h2 className="tw-workout-title">{workout.name?.toUpperCase()}</h2>

                    <div className="tw-divider" />

                    <div className="tw-exercises">
                        {workout.exercises?.slice(0, 6).map((ex, i) => (
                            <div key={i} className="tw-exercise-row">
                                <span className="tw-ex-header">{ex.exerciseName}</span>
                                <span className="tw-ex-badge">
                                    {ex.sets || 1} × {ex.weight ? `${ex.weight}kg × ` : ''}{ex.reps || '—'}
                                </span>
                            </div>
                        ))}
                        {(workout.exercises?.length || 0) > 6 && (
                            <div className="tw-more">+{workout.exercises.length - 6} more</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TodayWorkout;
