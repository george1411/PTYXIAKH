import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, LabelList, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import axios from 'axios';
import './Nutrition.css';

// ─── Range Toggle ─────────────────────────────────────────────
const RangeToggle = ({ value, onChange, options }) => (
    <div className="nutrition-range-toggle">
        {options.map(opt => (
            <button
                key={opt.value}
                className={`nutrition-range-btn ${value === opt.value ? 'active' : ''}`}
                onClick={() => onChange(opt.value)}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

// ─── Macro field definitions (used in edit modal) ─────────────
const MACRO_FIELDS = [
    { key: 'cal',   label: 'Calories', unit: 'kcal', min: 500,  max: 6000, color: '#e0e0e0' },
    { key: 'prot',  label: 'Protein',  unit: 'g',    min: 10,   max: 500,  color: '#a5b4fc' },
    { key: 'carbs', label: 'Carbs',    unit: 'g',    min: 10,   max: 1000, color: '#c4b5fd' },
    { key: 'fat',   label: 'Fat',      unit: 'g',    min: 5,    max: 300,  color: '#d8b4fe' },
];

// ─── HeroDay — replaces DailyMacroTracker ────────────────────
const DailyMacroTracker = ({ mealsData, balanceData, loading, onGoalsUpdated }) => {
    const totals = mealsData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const [calTarget,     setCalTarget]     = useState(2500);
    const [proteinTarget, setProteinTarget] = useState(150);
    const [carbsTarget,   setCarbsTarget]   = useState(200);
    const [fatTarget,     setFatTarget]     = useState(50);
    const [editOpen, setEditOpen] = useState(false);
    const [draft, setDraft] = useState({ cal: 2500, prot: 150, carbs: 200, fat: 50 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (balanceData) {
            setCalTarget(balanceData.target || 2500);
            setProteinTarget(balanceData.proteinTarget || 150);
            setCarbsTarget(balanceData.carbsTarget || Math.round((balanceData.target || 2500) * 0.45 / 4));
            setFatTarget(balanceData.fatTarget || Math.round((balanceData.target || 2500) * 0.25 / 9));
        }
    }, [balanceData]);

    const openEdit = () => {
        setDraft({ cal: calTarget, prot: proteinTarget, carbs: carbsTarget, fat: fatTarget });
        setEditOpen(true);
    };

    const handleSave = async () => {
        const cal   = parseInt(draft.cal);
        const prot  = parseInt(draft.prot);
        const carbs = parseInt(draft.carbs);
        const fat   = parseInt(draft.fat);
        if (!cal || !prot || cal < 500 || prot < 10) return;
        setSaving(true);
        try {
            await axios.put('/api/v1/nutrition/goals', { calories: cal, protein: prot, carbs, fat }, { withCredentials: true });
            setCalTarget(cal);
            setProteinTarget(prot);
            setCarbsTarget(carbs);
            setFatTarget(fat);
            setEditOpen(false);
            if (onGoalsUpdated) onGoalsUpdated();
        } catch { /* silent */ }
        setSaving(false);
    };

    const remaining = Math.max(0, calTarget - totals.calories);
    const p = Math.min(1, totals.calories / Math.max(1, calTarget));
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
    });

    const R = 110, STROKE = 14, CX = 130, CY = 130;
    const CIRC = 2 * Math.PI * R;

    const macros = [
        { label: 'Calories', cur: totals.calories, max: calTarget,     color: '#e0e0e0', bg: 'linear-gradient(90deg, #2a2a2a, #e0e0e0)', unit: 'kcal' },
        { label: 'Protein',  cur: totals.protein,  max: proteinTarget, color: '#a5b4fc', bg: 'linear-gradient(90deg, #334, #a5b4fc)',    unit: 'g' },
        { label: 'Carbs',    cur: totals.carbs,    max: carbsTarget,   color: '#c4b5fd', bg: 'linear-gradient(90deg, #1e1635, #c4b5fd)', unit: 'g' },
        { label: 'Fat',      cur: totals.fat,      max: fatTarget,     color: '#d8b4fe', bg: 'linear-gradient(90deg, #1e0a35, #d8b4fe)', unit: 'g' },
    ];

    return (
        <div className="nutrition-card" style={{ padding: '24px 28px', position: 'relative' }}>
            {/* Hero row — ring + headline */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'center', marginBottom: 22 }}>
                <div style={{ position: 'relative', width: 240, height: 240, flexShrink: 0 }}>
                    <svg width="240" height="240" viewBox="0 0 260 260">
                        <circle cx={CX} cy={CY} r={R}
                            stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} fill="none" />
                        <circle cx={CX} cy={CY} r={R}
                            stroke="#A5B4FC" strokeWidth={STROKE} fill="none"
                            strokeDasharray={CIRC}
                            strokeDashoffset={CIRC * (1 - p)}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${CX} ${CY})`}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.2em', color: '#a5b4fc' }}>
                            REMAINING
                        </div>
                        <div style={{
                            fontSize: 60, fontWeight: 800, letterSpacing: '-0.035em',
                            color: '#f0f0f0', marginTop: 6, lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {loading ? '—' : remaining.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.06em' }}>kcal</span>
                            <button onClick={openEdit} title="Edit nutrition goals"
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#f0f0f0'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                                <Pencil size={10} />
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span className="nutrition-section-label" style={{ color: '#a5b4fc' }}>
                            {today.toUpperCase()}
                        </span>
                    </div>
                    <h1 style={{
                        margin: 0, fontSize: 30, fontWeight: 800,
                        letterSpacing: '-0.025em', lineHeight: 1.1, color: '#f0f0f0',
                    }}>
                        <span style={{ color: '#e0e0e0' }}>{loading ? '—' : Math.round(totals.calories).toLocaleString()} kcal</span> <span style={{ color: '#A5B4FC' }}>consumed today</span>
                    </h1>
                </div>
            </div>

            {/* Macro strip */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {macros.map(m => {
                    const mp = Math.min(1, m.cur / Math.max(1, m.max));
                    return (
                        <div key={m.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: '#888', textTransform: 'uppercase' }}>{m.label}</span>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
                                    <span style={{ color: '#f0f0f0' }}>{m.cur < 10 ? m.cur.toFixed(1) : Math.round(m.cur)}</span>
                                    <span style={{ color: '#555' }}> / {m.max} {m.unit}</span>
                                </span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${mp * 100}%`, height: '100%', background: m.bg, borderRadius: 999, transition: 'width 0.4s ease' }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Goal edit popover */}
            {editOpen && (
                <div style={{ position: 'absolute', top: 56, left: 16, zIndex: 50, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '18px 20px', width: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f0f0' }}>Edit Goals</span>
                        <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}><X size={15} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {MACRO_FIELDS.map(f => (
                            <div key={f.key}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{f.label} ({f.unit})</label>
                                <input
                                    type="number" min={f.min} max={f.max}
                                    value={draft[f.key]}
                                    onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${f.color}40`, borderRadius: 7, padding: '7px 10px', color: '#f0f0f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{ marginTop: 14, width: '100%', background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '8px 0', fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                    >
                        {saving ? 'Saving…' : 'Save Goals'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Nutrition History Chart ──────────────────────────────────
const NutritionHistoryChart = () => {
    const [range, setRange] = useState('7');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`/api/v1/nutrition/history?range=${range}`, { withCredentials: true })
            .then(res => setData(res.data.data || []))
            .catch(err => console.error('Nutrition history error:', err))
            .finally(() => setLoading(false));
    }, [range]);

    const chartData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Calories: Math.round(d.calories || 0),
        Protein: Math.round(d.protein || 0),
    }));

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <span className="nutrition-section-label">NUTRITION HISTORY</span>
                </div>
                <RangeToggle
                    value={range}
                    onChange={setRange}
                    options={[
                        { value: '7',  label: '7D'  },
                        { value: '30', label: '30D' },
                        { value: '90', label: '90D' },
                    ]}
                />
            </div>
            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : chartData.length === 0 ? (
                <div className="nutrition-empty">
                    <p>No history yet — log some meals!</p>
                </div>
            ) : (
                <div className="nutrition-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={2}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={40} domain={[0, 3000]} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#888' }} />
                            <Bar dataKey="Calories" fill="#e0e0e0" radius={[3, 3, 0, 0]}>
                                <LabelList dataKey="Calories" position="top" style={{ fill: '#e0e0e0', fontSize: 10, fontWeight: 600 }} />
                            </Bar>
                            <Bar dataKey="Protein" fill="#a5b4fc" radius={[3, 3, 0, 0]}>
                                <LabelList dataKey="Protein" position="top" style={{ fill: '#a5b4fc', fontSize: 10, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// ─── Weekly Nutrition Summary ─────────────────────────────────
export const WeeklyNutritionSummary = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/v1/nutrition/weekly', { withCredentials: true })
            .then(res => setData(res.data.data || []))
            .catch(err => console.error('Weekly nutrition error:', err))
            .finally(() => setLoading(false));
    }, []);

    const chartData = data.map(d => ({
        day: d.dayShort,
        Protein: Math.round(d.protein || 0),
        Carbs:   Math.round(d.carbs   || 0),
        Fat:     Math.round(d.fat     || 0),
    }));

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <h3>Weekly Summary</h3>
                </div>
                <span className="nutrition-subtext">This week (g)</span>
            </div>
            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <div className="nutrition-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={14}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={32} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                labelStyle={{ color: '#888', fontSize: 12 }}
                                itemStyle={{ color: '#e0e0e0' }}
                                formatter={(v) => [`${v}g`]}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#888' }} />
                            <Bar dataKey="Protein" stackId="a" fill="#e0e0e0" />
                            <Bar dataKey="Carbs"   stackId="a" fill="#888" />
                            <Bar dataKey="Fat"     stackId="a" fill="#555" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

// ─── WaterIntakeTracker — single filling glass ────────────────
export const WaterIntakeTracker = () => {
    const [glasses, setGlasses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const goal = 8;

    useEffect(() => {
        axios.get('/api/v1/dailylogs/today', { withCredentials: true })
            .then(res => setGlasses(res.data.data?.waterIntake || 0))
            .catch(err => console.error('Water intake error:', err))
            .finally(() => setLoading(false));
    }, []);

    const update = async (newVal) => {
        if (saving || newVal < 0 || newVal > goal) return;
        setSaving(true);
        try {
            await axios.post('/api/v1/dailylogs/water', { glasses: newVal }, { withCredentials: true });
            setGlasses(newVal);
        } catch (err) {
            console.error('Water update error:', err);
        } finally { setSaving(false); }
    };

    const fillPct  = glasses / goal;
    const isFull   = glasses >= goal;
    const isEmpty  = glasses === 0;

    // SVG glass geometry
    const W = 180, H = 240;
    const glassTop = 12, glassBot = 228;
    const topL = 14, topR = 166;
    const botL = 36, botR = 144;
    const innerH = glassBot - glassTop;
    const waterTopY = glassBot - fillPct * innerH;
    const textDark = fillPct > 0.55;

    return (
        <div className="nutrition-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <>
                    {/* Big glass — click to add */}
                    <div style={{ display: 'flex', justifyContent: 'center', flex: 1, position: 'relative', paddingTop: 18 }}>
                        <svg
                            viewBox={`0 0 ${W} ${H}`}
                            style={{ width: '100%', maxWidth: 200, height: H, cursor: isFull ? 'default' : 'pointer', overflow: 'hidden', display: 'block' }}
                            onClick={() => !isFull && update(glasses + 1)}
                            onContextMenu={e => { e.preventDefault(); !isEmpty && update(glasses - 1); }}
                        >
                            <defs>
                                <clipPath id="wglass-clip">
                                    <polygon points={`${topL},${glassTop} ${topR},${glassTop} ${botR},${glassBot} ${botL},${glassBot}`} />
                                </clipPath>
                                <linearGradient id="wglass-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.85" />
                                    <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
                                </linearGradient>
                            </defs>

                            {/* Glass body background */}
                            <polygon
                                points={`${topL},${glassTop} ${topR},${glassTop} ${botR},${glassBot} ${botL},${glassBot}`}
                                fill="rgba(255,255,255,0.03)"
                            />

                            {/* Water fill */}
                            <g clipPath="url(#wglass-clip)">
                                <rect
                                    x="0" y={glassTop} width={W} height={innerH}
                                    fill="url(#wglass-grad)"
                                    style={{
                                        transformOrigin: `${W / 2}px ${glassBot}px`,
                                        transform: `scaleY(${fillPct})`,
                                        transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                            </g>

                            {/* Glass outline */}
                            <polygon
                                points={`${topL},${glassTop} ${topR},${glassTop} ${botR},${glassBot} ${botL},${glassBot}`}
                                fill="none"
                                stroke={isEmpty ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.55)'}
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                style={{ transition: 'stroke 0.4s' }}
                            />

                        </svg>

                    </div>

                    {/* Dots indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 4 }}>
                        {Array.from({ length: goal }).map((_, i) => (
                            <div key={i} style={{
                                width: 7, height: 7,
                                borderRadius: '50%',
                                background: i < glasses ? '#a5b4fc' : 'rgba(255,255,255,0.08)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Chat-style Meal Logger (Claude-powered) ──────────────────
const CHAT_MEAL_TYPES   = ['breakfast', 'lunch', 'dinner', 'snack'];
const CHAT_MEAL_LABELS  = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

const MealLogger = ({ mealsData, onUpdate, loading }) => {
    const [input,     setInput]     = useState('');
    const [mealType,  setMealType]  = useState('breakfast');
    const [sending,   setSending]   = useState(false);
    const [pending,   setPending]   = useState(null);   // text currently being parsed
    const [errorMsg,  setErrorMsg]  = useState(null);
    const feedRef = useRef(null);

    // Auto-scroll feed to bottom on change
    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [mealsData, sending, errorMsg]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput('');
        setErrorMsg(null);
        setPending(text);
        setSending(true);
        try {
            await axios.post('/api/v1/meals/parse', { text, mealType }, { withCredentials: true });
            onUpdate();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Could not parse your meal. Try again.');
        } finally {
            setSending(false);
            setPending(null);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleDeleteItem = async (mealId) => {
        try {
            await axios.delete(`/api/v1/meals/${mealId}`, { withCredentials: true });
            onUpdate();
        } catch (err) {
            console.error('Delete meal error:', err);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Clear all of today's meals? This can't be undone.")) return;
        try {
            await axios.delete('/api/v1/meals/today', { withCredentials: true });
            setErrorMsg(null);
            onUpdate();
        } catch (err) {
            console.error('Clear meals error:', err);
        }
    };

    const grouped = mealsData?.meals || { breakfast: [], lunch: [], dinner: [], snack: [] };
    const totalItems = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);
    const canSend = input.trim().length > 0 && !sending;

    return (
        <div className="nutrition-card" style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', padding: 0, overflow: 'hidden',
        }}>
            {/* ── Header ── */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <span className="nutrition-section-label">TODAY'S MEALS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {totalItems > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: '#555',
                            background: 'rgba(255,255,255,0.06)',
                            padding: '3px 10px', borderRadius: 999,
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                        </span>
                    )}
                    {totalItems > 0 && (
                        <button
                            onClick={handleClearAll}
                            title="Clear all of today's meals"
                            style={{
                                background: 'none', border: 'none', padding: 4,
                                color: '#444', cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#444'}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Feed ── */}
            <div ref={feedRef} style={{
                flex: 1, overflowY: 'auto',
                padding: '6px 14px 14px',
                display: 'flex', flexDirection: 'column',
                minHeight: 0,
            }}>
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 28 }}>
                        <div className="nutrition-spinner" />
                    </div>
                )}
                {!loading && totalItems === 0 && !sending && !errorMsg && (
                    <div style={{
                        textAlign: 'center', paddingTop: 36,
                        color: '#3a3a3a', fontSize: 13, fontWeight: 500,
                    }}>
                        Describe what you ate to log a meal
                    </div>
                )}

                {/* Grouped by meal category */}
                {!loading && CHAT_MEAL_TYPES.map(type => {
                    const items = grouped[type] || [];
                    if (items.length === 0) return null;
                    const kcal = items.reduce((s, m) => s + (m.calories || 0), 0);
                    return (
                        <div key={type} style={{ marginTop: 14 }}>
                            <div style={{
                                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                                marginBottom: 2, padding: '0 4px',
                            }}>
                                <span style={{
                                    fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em',
                                    color: '#a5b4fc', textTransform: 'uppercase',
                                }}>
                                    {CHAT_MEAL_LABELS[type]}
                                </span>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: '#555',
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    {Math.round(kcal)} kcal
                                </span>
                            </div>
                            {items.map(it => (
                                <div key={it.id} className="meal-log-card-wrap" style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 4px 9px 8px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: 14, fontWeight: 600, color: '#e0e0e0',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {it.foodName}
                                        </div>
                                        {it.amount && (
                                            <div style={{
                                                fontSize: 11, color: '#555', fontWeight: 500, marginTop: 2,
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {it.amount}{it.unit && it.unit !== 'qty' ? it.unit : ''}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: 700, color: '#888',
                                        fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                                    }}>
                                        {Math.round(it.calories || 0)} kcal
                                    </span>
                                    <button
                                        className="meal-log-card-delete"
                                        onClick={() => handleDeleteItem(it.id)}
                                        title="Remove"
                                        style={{
                                            background: 'none', border: 'none', padding: 2,
                                            color: '#444', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', flexShrink: 0,
                                            opacity: 0, transition: 'opacity 0.15s, color 0.15s',
                                        }}
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })}

                {/* Pending send: subtle inline loading (no chat bubble) */}
                {sending && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        marginTop: 14, padding: '9px 8px',
                        color: '#666',
                    }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#555',
                                    animation: `chat-bounce 1s ${i * 0.16}s ease-in-out infinite`,
                                }} />
                            ))}
                        </div>
                        <span style={{
                            fontSize: 12, fontWeight: 500, color: '#555',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            Adding “{pending}”…
                        </span>
                    </div>
                )}

                {/* Error bubble */}
                {errorMsg && !sending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 14 }}>
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.22)',
                            borderRadius: '4px 16px 16px 16px',
                            padding: '9px 14px', maxWidth: '85%',
                            fontSize: 12, fontWeight: 600,
                            color: '#f87171', lineHeight: 1.4,
                        }}>
                            {errorMsg}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Composer ── */}
            <div style={{
                padding: '10px 12px 14px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 9,
            }}>
                {/* Meal-type buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {CHAT_MEAL_TYPES.map(t => (
                        <button key={t} onClick={() => setMealType(t)} style={{
                            flex: 1, padding: '5px 0',
                            border: mealType === t
                                ? '1px solid rgba(165,180,252,0.5)'
                                : '1px solid rgba(255,255,255,0.08)',
                            background: mealType === t
                                ? 'rgba(165,180,252,0.12)'
                                : 'transparent',
                            borderRadius: 8,
                            color: mealType === t ? '#a5b4fc' : '#555',
                            fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            {CHAT_MEAL_LABELS[t]}
                        </button>
                    ))}
                </div>

                {/* Text input + send */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="e.g. 2 eggs and toast with butter…"
                        rows={1}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 12, padding: '10px 13px',
                            color: '#f0f0f0', fontSize: 13,
                            fontFamily: 'inherit', resize: 'none',
                            outline: 'none', lineHeight: 1.4,
                            maxHeight: 80, overflowY: 'auto',
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: canSend ? '#a5b4fc' : 'rgba(165,180,252,0.12)',
                            border: 'none',
                            cursor: canSend ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: canSend ? '#0a0a0a' : '#444',
                            transition: 'background 0.15s, color 0.15s',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Nutrition Page ──────────────────────────────────────
const Nutrition = ({ userId: userIdProp }) => {
    const [mealsData,    setMealsData]    = useState(null);
    const [balanceData,  setBalanceData]  = useState(null);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [loadingBal,   setLoadingBal]   = useState(true);
    const userId = userIdProp ?? null;

    const fetchMeals = useCallback(() => {
        setLoadingMeals(true);
        axios.get('/api/v1/meals', { withCredentials: true })
            .then(res => setMealsData(res.data.data))
            .catch(err => console.error('Meals error:', err))
            .finally(() => setLoadingMeals(false));
    }, []);

    const fetchBalance = useCallback(() => {
        setLoadingBal(true);
        axios.get('/api/v1/nutrition/balance', { withCredentials: true })
            .then(res => setBalanceData(res.data.data))
            .catch(err => console.error('Balance error:', err))
            .finally(() => setLoadingBal(false));
    }, []);

    useEffect(() => {
        fetchMeals();
        fetchBalance();
    }, [fetchMeals, fetchBalance]);

    const handleMealUpdate = useCallback(() => {
        fetchMeals();
        fetchBalance();
    }, [fetchMeals, fetchBalance]);

    return (
        <div className="nutrition-page">
            <div className="nutrition-hero">
                {/* Left: HeroDay + bottom row */}
                <div className="nutrition-hero-left">
                    <DailyMacroTracker
                        mealsData={mealsData}
                        balanceData={balanceData}
                        loading={loadingMeals || loadingBal}
                        onGoalsUpdated={fetchBalance}
                    />
                    <div className="nutrition-bottom-row">
                        <WaterIntakeTracker />
                        <NutritionHistoryChart />
                    </div>
                </div>

                {/* Right: full-height meals timeline */}
                <MealLogger
                    mealsData={mealsData}
                    onUpdate={handleMealUpdate}
                    loading={loadingMeals}
                />
            </div>
        </div>
    );
};

export default Nutrition;
