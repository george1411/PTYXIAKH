import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import axios from 'axios';
import WeeklySteps from '../../../customer/widgets/WeeklySteps/WeeklySteps';
import './Progress.css';

// ─── Range Toggle ────────────────────────────────────────────
const RangeToggle = ({ value, onChange, options }) => (
    <div className="progress-range-toggle">
        {options.map(opt => (
            <button
                key={opt.value}
                className={`progress-range-btn ${value === opt.value ? 'active' : ''}`}
                onClick={() => onChange(opt.value)}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

// ─── Weight History Section ──────────────────────────────────
const WeightHistory = () => {
    const [range, setRange] = useState('90');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weightGoal, setWeightGoal] = useState(null);
    const [showLog, setShowLog] = useState(false);
    const [logValue, setLogValue] = useState('');
    const [logSaving, setLogSaving] = useState(false);

    useEffect(() => {
        const goal = localStorage.getItem('weightGoal');
        if (goal) setWeightGoal(parseFloat(goal));
    }, []);

    const fetchData = () => {
        setLoading(true);
        axios.get(`/api/v1/stats/weight-history?range=${range}`, { withCredentials: true })
            .then(res => setData(res.data.data))
            .catch(err => console.error('Weight history error:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [range]);

    const handleLogWeight = async (e) => {
        e.preventDefault();
        if (!logValue) return;
        setLogSaving(true);
        try {
            await axios.post('/api/v1/stats/weekly-measurements', { weight: parseFloat(logValue) }, { withCredentials: true });
            setShowLog(false);
            setLogValue('');
            fetchData();
        } catch (err) {
            console.error('Log weight error:', err);
        } finally {
            setLogSaving(false);
        }
    };

    const chartData = useMemo(() => {
        if (!data?.history) return [];
        return data.history.map(h => ({
            date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            weight: h.weight
        }));
    }, [data]);

    const diffClass = data?.diff > 0 ? 'positive' : data?.diff < 0 ? 'negative' : 'neutral';
    const diffText = data?.diff > 0 ? `+${data.diff.toFixed(1)}` : data?.diff < 0 ? data.diff.toFixed(1) : '0';

    return (
        <div className="progress-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>Weight History</h3>
                    <div className="wh-log-anchor">
                        <button
                            className={`wh-log-btn ${showLog ? 'active' : ''}`}
                            onClick={() => { setShowLog(v => !v); setLogValue(''); }}
                            title="Log today's weight"
                        >
                            {showLog ? '×' : '+'}
                        </button>
                        {showLog && (
                            <form onSubmit={handleLogWeight} className="wh-log-popup">
                                <input
                                    type="number"
                                    min="20"
                                    max="300"
                                    step="0.1"
                                    placeholder="kg"
                                    value={logValue}
                                    onChange={e => setLogValue(e.target.value)}
                                    autoFocus
                                    className="wh-log-input"
                                />
                                <button
                                    type="submit"
                                    disabled={logSaving || !logValue}
                                    className="wh-log-save"
                                >
                                    {logSaving ? '…' : 'Save'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                <RangeToggle
                    value={range}
                    onChange={setRange}
                    options={[
                        { value: '30', label: '1M' },
                        { value: '90', label: '3M' },
                        { value: '365', label: '1Y' },
                        { value: 'all', label: 'All' },
                    ]}
                />
            </div>

            {loading ? (
                <div className="progress-loading"><div className="progress-spinner" /></div>
            ) : chartData.length === 0 ? (
                <div className="progress-empty">
                    <p>No weight entries yet</p>
                </div>
            ) : (
                <>
                    <div className="progress-weight-stats">
                        <span className="progress-weight-current">{data.current}</span>
                        <span className="progress-weight-unit">kg</span>
                        <span className={`progress-weight-diff ${diffClass}`}>{diffText} kg</span>
                    </div>
                    <div className="progress-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818CF8" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="0" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                <YAxis
                                    domain={[
                                        (dataMin) => {
                                            const min = weightGoal ? Math.min(dataMin, weightGoal) : dataMin;
                                            return Math.floor(min - 5);
                                        },
                                        (dataMax) => {
                                            const max = weightGoal ? Math.max(dataMax, weightGoal) : dataMax;
                                            return Math.ceil(max + 5);
                                        }
                                    ]}
                                    tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={40}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                    labelStyle={{ color: '#888', fontSize: 12 }}
                                    itemStyle={{ color: '#a5b4fc' }}
                                    formatter={(v) => [`${v} kg`, 'Weight']}
                                />
                                <Area type="monotone" dataKey="weight" stroke="#818CF8" strokeWidth={2.5} fill="url(#weightGradient)" dot={{ r: 3, fill: '#111', stroke: '#818CF8', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#a5b4fc' }} />
                                {weightGoal && (
                                    <ReferenceLine
                                        y={weightGoal}
                                        stroke="#818CF8"
                                        strokeDasharray="6 4"
                                        strokeWidth={1.5}
                                        label={{ value: `${weightGoal}kg goal`, position: 'right', fill: '#818CF8', fontSize: 11, fontWeight: 700 }}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};


// ─── Exercise PRs Section ────────────────────────────────────
const ExercisePRs = () => {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/v1/stats/exercise-prs', { withCredentials: true })
            .then(res => setPrs(res.data.data || []))
            .catch(err => console.error('Exercise PRs error:', err))
            .finally(() => setLoading(false));
    }, []);

    const getRankBadge = (i) => {
        if (i === 0) return { label: '1', class: 'gold' };
        if (i === 1) return { label: '2', class: 'silver' };
        if (i === 2) return { label: '3', class: 'bronze' };
        return null;
    };

    const parseMuscles = (muscles) => {
        if (!muscles) return '';
        try {
            const arr = typeof muscles === 'string' ? JSON.parse(muscles) : muscles;
            return Array.isArray(arr) ? arr.join(', ') : String(muscles);
        } catch { return String(muscles); }
    };

    return (
        <div className="progress-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>Personal Records</h3>
                </div>
            </div>

            {loading ? (
                <div className="progress-loading"><div className="progress-spinner" /></div>
            ) : prs.length === 0 ? (
                <div className="progress-empty">
                    <p>No PRs yet — start logging weights!</p>
                </div>
            ) : (
                <div className="progress-pr-grid">
                    {[prs.slice(0, 4), prs.slice(4, 8)].map((col, colIdx) => (
                        <div key={colIdx} className="progress-pr-col">
                            {col.map((pr, j) => {
                                const i = colIdx * 4 + j;
                                const badge = getRankBadge(i);
                                return (
                                    <div key={pr.exercise} className="progress-pr-item">
                                        <div className="progress-pr-item-left">
                                            {badge ? (
                                                <span className={`progress-pr-badge ${badge.class}`}>{badge.label}</span>
                                            ) : (
                                                <span className="progress-pr-num">{i + 1}</span>
                                            )}
                                            <div className="progress-pr-info">
                                                <div className="progress-pr-exercise">{pr.exercise}</div>
                                                <div className="progress-pr-muscles">{parseMuscles(pr.muscles)}</div>
                                            </div>
                                        </div>
                                        <div className="progress-pr-kg">{pr.maxWeight} kg</div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Consistency Calendar Section ────────────────────────────
export const ConsistencyCalendar = () => {
    const [workoutDates, setWorkoutDates] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/v1/stats/workout-calendar?months=6', { withCredentials: true })
            .then(res => {
                const dates = (res.data.data || []).map(d => {
                    // Normalize date strings to YYYY-MM-DD
                    if (typeof d === 'string') return d.split('T')[0];
                    return d;
                });
                setWorkoutDates(new Set(dates));
            })
            .catch(err => console.error('Workout calendar error:', err))
            .finally(() => setLoading(false));
    }, []);

    const calendarData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Go back ~26 weeks (6 months)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 26 * 7);
        // Align to Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const weeks = [];
        const months = [];
        let currentDate = new Date(startDate);
        let lastMonth = -1;

        while (currentDate <= today || weeks.length === 0 || weeks[weeks.length - 1].length < 7) {
            const weekDay = currentDate.getDay(); // 0=Sun
            if (weekDay === 0) {
                weeks.push([]);
                const m = currentDate.getMonth();
                if (m !== lastMonth) {
                    months.push({ index: weeks.length - 1, label: currentDate.toLocaleDateString(undefined, { month: 'short' }) });
                    lastMonth = m;
                }
            }

            if (weeks.length === 0) weeks.push([]);

            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const isFuture = currentDate > today;
            const isWorkout = workoutDates.has(dateStr);

            weeks[weeks.length - 1].push({
                date: dateStr,
                level: isFuture ? 'future' : isWorkout ? 'level-1' : 'level-0',
                title: isFuture ? '' : `${currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}${isWorkout ? ' ✓' : ''}`,
            });

            currentDate.setDate(currentDate.getDate() + 1);

            // Safety: max 30 weeks
            if (weeks.length > 30) break;
        }

        return { weeks, months };
    }, [workoutDates]);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="progress-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>Workout Consistency</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>Last 6 months</span>
            </div>

            {loading ? (
                <div className="progress-loading"><div className="progress-spinner" /></div>
            ) : (
                <div className="progress-heatmap-container">
                    {/* Month labels */}
                    <div className="progress-heatmap-months">
                        {calendarData.months.map((m, i) => (
                            <span
                                key={i}
                                className="progress-heatmap-month-label"
                                style={{ marginLeft: i === 0 ? 0 : `${(m.index - (calendarData.months[i - 1]?.index || 0) - 1) * 16}px` }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    <div className="progress-heatmap-grid-wrapper">
                        {/* Day labels */}
                        <div className="progress-heatmap-day-labels">
                            {dayLabels.map((d, i) => (
                                <div key={i} className="progress-heatmap-day-label">
                                    {i % 2 === 1 ? d : ''}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="progress-heatmap-grid">
                            {calendarData.weeks.map((week, wi) => (
                                <div key={wi} className="progress-heatmap-week">
                                    {week.map((day, di) => (
                                        <div
                                            key={di}
                                            className={`progress-heatmap-cell ${day.level}`}
                                            title={day.title}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="progress-heatmap-legend">
                        <span className="progress-heatmap-legend-text">Less</span>
                        <div className="progress-heatmap-legend-cell" style={{ background: '#2a2a2a' }} />
                        <div className="progress-heatmap-legend-cell" style={{ background: '#818CF8' }} />
                        <span className="progress-heatmap-legend-text">More</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Weight Prediction (AI) ──────────────────────────────────
export const WeightPrediction = () => {
    // Prediction configuration
    const [duration, setDuration] = useState(4);
    const [activityLevel, setActivityLevel] = useState('Moderately Active');
    const [sleepQuality, setSleepQuality] = useState('Good');
    const [stressLevel, setStressLevel] = useState(5);

    // Model inputs from baseline (auto-filled, user editable)
    const [currentWeight, setCurrentWeight] = useState('');
    const [dailyCalories, setDailyCalories] = useState('');

    // UI state
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [baselineLoading, setBaselineLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch baseline data on mount
    useEffect(() => {
        const fetchBaseline = async () => {
            try {
                const res = await axios.get('/api/v1/stats/predict-baseline', { withCredentials: true });
                if (res.data.data && res.data.data.age) {
                    setCurrentWeight(res.data.data.current_weight_kg || '');
                    setDailyCalories(res.data.data.daily_calories || '');
                }
            } catch (err) {
                console.error("Failed to fetch baseline", err);
            } finally {
                setBaselineLoading(false);
            }
        };
        fetchBaseline();
    }, []);

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setPrediction(null);
        try {
            const res = await axios.post('/api/v1/stats/predict-weight', {
                duration_weeks: duration,
                activity_level: activityLevel,
                sleep_quality: sleepQuality,
                stress_level: stressLevel,
                current_weight_kg: parseFloat(currentWeight),
                daily_calories: parseInt(dailyCalories)
            }, { withCredentials: true });
            setPrediction(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Prediction failed. Make sure the AI service is running.');
        } finally {
            setLoading(false);
        }
    };

    const changeClass = prediction?.weight_change_kg > 0 ? 'positive' : prediction?.weight_change_kg < 0 ? 'negative' : 'neutral';

    return (
        <div className="progress-card progress-card-prediction">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>AI Weight Prediction</h3>
                </div>
            </div>

            {baselineLoading ? (
                <div className="progress-loading">
                    <div className="progress-spinner"></div>
                </div>
            ) : (
                <div className="prediction-form">
                    <div className="prediction-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                        <div className="prediction-field">
                            <label>Current Weight (kg)</label>
                            <input
                                type="number"
                                className="prediction-input"
                                value={currentWeight}
                                onChange={e => setCurrentWeight(e.target.value)}
                                placeholder="e.g. 80"
                            />
                        </div>
                        <div className="prediction-field">
                            <label>Avg Daily Calories (kcal)</label>
                            <input
                                type="number"
                                className="prediction-input"
                                value={dailyCalories}
                                onChange={e => setDailyCalories(e.target.value)}
                                placeholder="e.g. 2000"
                            />
                        </div>
                    </div>

                    <div className="prediction-field">
                        <label>Duration (weeks): <strong>{duration}</strong></label>
                        <input
                            type="range" min="1" max="12" value={duration}
                            onChange={e => setDuration(parseInt(e.target.value))}
                            className="prediction-slider"
                        />
                        <div className="prediction-slider-labels">
                            <span>1w</span><span>6w</span><span>12w</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="prediction-field" style={{ flex: 1 }}>
                            <label>Activity Level</label>
                            <select
                                value={activityLevel}
                                onChange={e => setActivityLevel(e.target.value)}
                                className="prediction-select"
                            >
                                <option value="Sedentary">Sedentary</option>
                                <option value="Lightly Active">Lightly Active</option>
                                <option value="Moderately Active">Moderately Active</option>
                                <option value="Very Active">Very Active</option>
                            </select>
                        </div>

                        <div className="prediction-field" style={{ flex: 1 }}>
                            <label>Sleep Quality</label>
                            <select
                                value={sleepQuality}
                                onChange={e => setSleepQuality(e.target.value)}
                                className="prediction-select"
                            >
                                <option value="Poor">Poor</option>
                                <option value="Fair">Fair</option>
                                <option value="Good">Good</option>
                                <option value="Excellent">Excellent</option>
                            </select>
                        </div>
                    </div>

                    <div className="prediction-field">
                        <label>Stress Level: <strong>{stressLevel}</strong>/10</label>
                        <input
                            type="range" min="1" max="10" value={stressLevel}
                            onChange={e => setStressLevel(parseInt(e.target.value))}
                            className="prediction-slider"
                        />
                        <div className="prediction-slider-labels">
                            <span>Low</span><span>Med</span><span>High</span>
                        </div>
                    </div>

                    <button
                        className="prediction-btn"
                        onClick={handlePredict}
                        disabled={loading}
                    >
                        {loading ? (
                            <><div className="progress-spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Predicting...</>
                        ) : (
                            <>Predict Weight</>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <div className="prediction-error">
                    {error}
                </div>
            )}

            {prediction && (
                <div className="prediction-result">
                    <div className="prediction-result-header">
                        Predicted weight in <strong>{prediction.duration_weeks} weeks</strong>
                    </div>
                    <div className="prediction-result-body">
                        <div className="prediction-weight-current">
                            <span className="prediction-weight-label">Current</span>
                            <span className="prediction-weight-value">{prediction.current_weight_kg} kg</span>
                        </div>
                        <div className="prediction-arrow">→</div>
                        <div className="prediction-weight-predicted">
                            <span className="prediction-weight-label">Predicted</span>
                            <span className="prediction-weight-value">{prediction.predicted_weight_kg} kg</span>
                        </div>
                    </div>
                    <div className={`prediction-change ${changeClass}`}>
                        {prediction.weight_change_kg > 0 ? '+' : ''}{prediction.weight_change_kg} kg
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── BMI Calculator ──────────────────────────────────────────
const BMI_CATEGORIES = [
    { label: 'Underweight', range: [0, 18.5], color: '#60a5fa', tip: 'Consider increasing your calorie intake with nutrient-dense foods.' },
    { label: 'Normal', range: [18.5, 25], color: '#818CF8', tip: 'Great job! Maintain your healthy lifestyle.' },
    { label: 'Overweight', range: [25, 30], color: '#a78bfa', tip: 'Small changes in diet and activity can make a big difference.' },
    { label: 'Obese', range: [30, 100], color: '#c084fc', tip: 'Consult with your trainer for a personalized plan.' },
];

export const BMICalculator = () => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmi, setBmi] = useState(null);
    const [category, setCategory] = useState(null);
    const [animatedBmi, setAnimatedBmi] = useState(0);

    // Auto-fill from profile on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // predict-baseline returns height, current_weight_kg, etc.
                const res = await axios.get('/api/v1/stats/predict-baseline', { withCredentials: true });
                const data = res.data.data;
                if (data) {
                    if (data.height) setHeight(String(data.height));
                    if (data.current_weight_kg) setWeight(String(data.current_weight_kg));
                }
            } catch (err) {
                console.error('BMI auto-fill error:', err);
            }
        };
        fetchData();
    }, []);

    // Recalculate BMI when inputs change
    useEffect(() => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (h > 0 && w > 0) {
            const heightM = h > 3 ? h / 100 : h; // support cm or meters
            const val = w / (heightM * heightM);
            const rounded = Math.round(val * 10) / 10;
            setBmi(rounded);
            setCategory(BMI_CATEGORIES.find(c => rounded >= c.range[0] && rounded < c.range[1]) || BMI_CATEGORIES[3]);
        } else {
            setBmi(null);
            setCategory(null);
        }
    }, [height, weight]);

    // Animate the BMI needle
    useEffect(() => {
        if (bmi === null) { setAnimatedBmi(0); return; }
        let start = animatedBmi;
        const end = bmi;
        const duration = 600;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setAnimatedBmi(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [bmi]);

    // SVG arc gauge
    const renderGauge = () => {
        const size = 200;
        const cx = size / 2;
        const cy = size / 2 + 10;
        const radius = 75;
        const startAngle = -180;
        const endAngle = 0;
        const totalAngle = endAngle - startAngle;

        // BMI range for gauge: 15 to 40
        const minBmi = 15;
        const maxBmi = 40;
        const clampedBmi = Math.max(minBmi, Math.min(maxBmi, animatedBmi));
        const needleAngle = startAngle + ((clampedBmi - minBmi) / (maxBmi - minBmi)) * totalAngle;

        const toRad = (deg) => (deg * Math.PI) / 180;
        const arcPath = (startDeg, endDeg) => {
            const s = toRad(startDeg);
            const e = toRad(endDeg);
            const x1 = cx + radius * Math.cos(s);
            const y1 = cy + radius * Math.sin(s);
            const x2 = cx + radius * Math.cos(e);
            const y2 = cy + radius * Math.sin(e);
            const large = endDeg - startDeg > 180 ? 1 : 0;
            return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
        };

        // Category arcs
        const segments = BMI_CATEGORIES.map(cat => {
            const segStart = startAngle + ((Math.max(cat.range[0], minBmi) - minBmi) / (maxBmi - minBmi)) * totalAngle;
            const segEnd = startAngle + ((Math.min(cat.range[1], maxBmi) - minBmi) / (maxBmi - minBmi)) * totalAngle;
            return { ...cat, segStart, segEnd };
        });

        // Needle endpoint
        const needleLen = radius - 15;
        const nx = cx + needleLen * Math.cos(toRad(needleAngle));
        const ny = cy + needleLen * Math.sin(toRad(needleAngle));

        return (
            <svg viewBox={`0 0 ${size} ${size / 2 + 40}`} className="bmi-gauge-svg">
                {/* Background arc */}
                <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#2a2a2a" strokeWidth="14" strokeLinecap="round" />
                {/* Category arcs */}
                {segments.map((seg, i) => (
                    <path key={i} d={arcPath(seg.segStart, seg.segEnd)} fill="none" stroke={seg.color} strokeWidth="14" strokeLinecap="butt" opacity="0.85" />
                ))}
                {/* Needle */}
                {bmi !== null && (
                    <>
                        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" />
                        <circle cx={cx} cy={cy} r="5" fill="#818CF8" />
                        <circle cx={cx} cy={cy} r="2.5" fill="#111" />
                    </>
                )}
                {/* Labels */}
                <text x={cx - radius - 4} y={cy + 16} fontSize="9" fill="#999" textAnchor="middle">15</text>
                <text x={cx + radius + 4} y={cy + 16} fontSize="9" fill="#999" textAnchor="middle">40</text>
            </svg>
        );
    };

    return (
        <div className="progress-card bmi-card">
            <div className="progress-card-header">
                <div className="progress-card-title">
                    <h3>BMI Calculator</h3>
                </div>
            </div>

            <div className="bmi-inputs">
                <div className="bmi-input-group">
                    <label>Height (cm)</label>
                    <input
                        type="number"
                        className="prediction-input"
                        placeholder="e.g. 175"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                    />
                </div>
                <div className="bmi-input-group">
                    <label>Weight (kg)</label>
                    <input
                        type="number"
                        className="prediction-input"
                        placeholder="e.g. 75"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                    />
                </div>
            </div>

            <div className="bmi-gauge-wrapper">
                {renderGauge()}
                {bmi !== null && (
                    <div className="bmi-value-display">
                        <span className="bmi-value" style={{ color: category?.color || '#e0e0e0' }}>{bmi}</span>
                        <span className="bmi-label">{category?.label}</span>
                    </div>
                )}
                {bmi === null && (
                    <div className="bmi-value-display">
                        <span className="bmi-placeholder">Enter your height &amp; weight</span>
                    </div>
                )}
            </div>

        </div>
    );
};

// ─── Main Progress Page ──────────────────────────────────────
const Progress = () => {
    return (
        <div className="progress-page">
            <div className="progress-header">
                <h2>Progress</h2>
            </div>

            <div className="progress-grid">
                {/* Row 1: Weight History | Personal Records */}
                <WeightHistory />
                <ExercisePRs />
                {/* Row 2: Weekly Steps | BMI Calculator */}
                <WeeklySteps />
                <BMICalculator />
            </div>
        </div>
    );
};

export default Progress;
