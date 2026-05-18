import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Search, AlertCircle, CheckCircle, Bookmark, BookmarkCheck, Pencil } from 'lucide-react';
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
    { key: 'cal',   label: 'Calories', unit: 'kcal', min: 500,  max: 6000 },
    { key: 'prot',  label: 'Protein',  unit: 'g',    min: 10,   max: 500  },
    { key: 'carbs', label: 'Carbs',    unit: 'g',    min: 10,   max: 1000 },
    { key: 'fat',   label: 'Fat',      unit: 'g',    min: 5,    max: 300  },
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
        { label: 'Calories', cur: totals.calories, max: calTarget,     color: '#e0e0e0', unit: 'kcal' },
        { label: 'Protein',  cur: totals.protein,  max: proteinTarget, color: '#a5b4fc', unit: 'g' },
        { label: 'Carbs',    cur: totals.carbs,    max: carbsTarget,   color: '#30a195', unit: 'g' },
        { label: 'Fat',      cur: totals.fat,      max: fatTarget,     color: '#A5B4FC', unit: 'g' },
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
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.06em', marginTop: 4 }}>
                            kcal
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
                        <span style={{ color: '#f0f0f0' }}>{loading ? '—' : Math.round(totals.calories).toLocaleString()} kcal</span> <span style={{ color: '#A5B4FC' }}>consumed today</span>
                    </h1>
                    <div style={{ fontSize: 14, color: '#888', fontWeight: 500, marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{Math.round(totals.protein)}g</span> protein
                        {' · '}
                        <span style={{ color: '#30a195', fontWeight: 700 }}>{Math.round(totals.carbs)}g</span> carbs
                        {' · '}
                        <span style={{ color: '#f0f0f0', fontWeight: 700 }}>{Math.round(totals.fat)}g</span> fat
                        <button onClick={openEdit} title="Edit nutrition goals"
                            style={{ background: 'none', border: 'none', padding: '0 0 0 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f0f0f0'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                            <Pencil size={11} />
                        </button>
                    </div>
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
                                <div style={{ width: `${mp * 100}%`, height: '100%', background: m.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
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
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{f.label} ({f.unit})</label>
                                <input
                                    type="number" min={f.min} max={f.max}
                                    value={draft[f.key]}
                                    onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', color: '#f0f0f0', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
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
                            <Bar dataKey="Protein" fill="#A5B4FC" radius={[3, 3, 0, 0]}>
                                <LabelList dataKey="Protein" position="top" style={{ fill: '#A5B4FC', fontSize: 10, fontWeight: 600 }} />
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
                                background: i < glasses ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Meal Logger ──────────────────────────────────────────────
const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
const MEAL_TIMES  = { breakfast: '08:30', lunch: '13:00', dinner: '19:30', snack: '16:00' };

// ─── localStorage helpers ─────────────────────────────────────
const recentKey = (uid) => `gymlit_recent_foods_${uid}`;
const savedKey  = (uid) => `gymlit_saved_foods_${uid}`;

const getRecent = (uid) => { try { return JSON.parse(localStorage.getItem(recentKey(uid))) || []; } catch { return []; } };
const getSaved  = (uid) => { try { return JSON.parse(localStorage.getItem(savedKey(uid)))  || []; } catch { return []; } };

const pushRecent = (uid, entry) => {
    const list = getRecent(uid).filter(f => f.food.toLowerCase() !== entry.food.toLowerCase());
    localStorage.setItem(recentKey(uid), JSON.stringify([entry, ...list].slice(0, 8)));
};

const toggleSavedFood = (uid, entry) => {
    const list = getSaved(uid);
    const exists = list.find(f => f.food.toLowerCase() === entry.food.toLowerCase());
    if (exists) localStorage.setItem(savedKey(uid), JSON.stringify(list.filter(f => f.food.toLowerCase() !== entry.food.toLowerCase())));
    else        localStorage.setItem(savedKey(uid), JSON.stringify([entry, ...list]));
};

const isSaved = (uid, food) => getSaved(uid).some(f => f.food.toLowerCase() === food.toLowerCase());

const UNITS = [
    { value: 'qty', label: 'qty' },
    { value: 'g',   label: 'g' },
    { value: 'ml',  label: 'ml' },
    { value: 'oz',  label: 'oz' },
    { value: 'cup', label: 'cup' },
    { value: 'tbsp',label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
];

const EMPTY_FORM = { mealType: 'breakfast', food: '', amount: '100', unit: 'g', foodName: '', calories: '', protein: '', carbs: '', fat: '' };

// ─── Meal Timeline Row ────────────────────────────────────────
const MealsTimelineRow = ({ type, items, openModal, handleDelete, recentMeals = [], onGhostClick, onGhostRemove, onMoveToType }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const isEmpty = items.length === 0;
    const totals = items.reduce((s, m) => ({
        calories: s.calories + (m.calories || 0),
        protein:  s.protein  + (m.protein  || 0),
        carbs:    s.carbs    + (m.carbs    || 0),
        fat:      s.fat      + (m.fat      || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    const ghosts = recentMeals.filter(r => r.mealType === type).slice(0, 3);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const mealId = e.dataTransfer.getData('mealId');
        const fromType = e.dataTransfer.getData('fromType');
        if (mealId && fromType !== type) onMoveToType(mealId, type);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                background: '#0a0a0a',
                border: isDragOver ? '1px solid rgba(165,180,252,0.45)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '16px 18px',
                flex: 1,
                minHeight: 0,
                transition: 'border-color 0.15s',
                boxShadow: isDragOver ? '0 0 0 3px rgba(165,180,252,0.08)' : 'none',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (isEmpty && ghosts.length === 0) ? 0 : 12, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0' }}>
                    {MEAL_LABELS[type]}
                </span>
                {!isEmpty && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#555', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' }}>
                        <span style={{ color: '#f0f0f0', fontWeight: 700 }}>{Math.round(totals.calories)}</span> kcal
                        {' · '}
                        <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{Math.round(totals.protein)}g</span> prot
                        {' · '}
                        <span style={{ color: '#30a195', fontWeight: 700 }}>{Math.round(totals.carbs)}g</span> carbs
                        {' · '}
                        <span style={{ color: '#A5B4FC', fontWeight: 700 }}>{Math.round(totals.fat)}g</span> fat
                    </span>
                )}
            </div>

            {!isEmpty && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {items.map(meal => (
                        <div key={meal.id}
                            draggable
                            onDragStart={e => {
                                e.dataTransfer.setData('mealId', meal.id);
                                e.dataTransfer.setData('fromType', type);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 10px 6px 13px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 999,
                                cursor: 'grab',
                            }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>
                                {meal.foodName}
                            </span>
                            {meal.amount && (
                                <span style={{ fontSize: 12, fontWeight: 500, color: '#666', fontVariantNumeric: 'tabular-nums' }}>
                                    {meal.amount}{meal.unit && meal.unit !== 'qty' ? meal.unit : ''}
                                </span>
                            )}
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#A5B4FC', fontVariantNumeric: 'tabular-nums' }}>
                                {Math.round(meal.calories || 0)}kcal
                            </span>
                            <button onClick={() => handleDelete(meal.id)}
                                style={{ background: 'transparent', border: 0, padding: 0, marginLeft: 2, color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isEmpty && ghosts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {ghosts.map((meal, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '5px 10px 5px 11px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 999,
                                opacity: 0.3,
                                transition: 'opacity 0.15s',
                                userSelect: 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.3'}
                        >
                            <div
                                onClick={() => onGhostClick(meal, type)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                            >
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f0' }}>
                                    {meal.foodName || meal.food}
                                </span>
                                {meal.amount && (
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#888', fontVariantNumeric: 'tabular-nums' }}>
                                        {meal.amount}{meal.unit && meal.unit !== 'qty' ? meal.unit : ''}
                                    </span>
                                )}
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC', fontVariantNumeric: 'tabular-nums' }}>
                                    {Math.round(meal.calories || 0)}kcal
                                </span>
                                <Plus size={9} style={{ color: '#666', flexShrink: 0 }} />
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); onGhostRemove(meal); }}
                                style={{ background: 'transparent', border: 0, padding: 0, marginLeft: 2, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#555'}
                            >
                                <X size={9} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MealLogger = ({ mealsData, onUpdate, loading, userId }) => {
    const [showModal, setShowModal]   = useState(false);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [lookupState, setLookup]    = useState('idle');
    const [lookupMsg, setLookupMsg]   = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recent, setRecent]         = useState([]);
    const [saved, setSaved]           = useState([]);
    const foodRef = useRef(null);
    const skipLookupRef      = useRef(false);
    const nutritionLockedRef = useRef(false);
    const prevFoodRef        = useRef('');

    useEffect(() => {
        if (userId) setRecent(getRecent(userId));
    }, [userId]);

    const openModal = (type) => {
        setRecent(getRecent(userId));
        setSaved(getSaved(userId));
        setForm({ ...EMPTY_FORM, mealType: type ?? EMPTY_FORM.mealType });
        setShowModal(true);
        setTimeout(() => foodRef.current?.focus(), 50);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setLookup('idle');
        setLookupMsg('');
        skipLookupRef.current      = false;
        nutritionLockedRef.current = false;
        prevFoodRef.current        = '';
    };

    const fillFromFood = (entry) => {
        skipLookupRef.current      = true;
        nutritionLockedRef.current = false;
        prevFoodRef.current        = entry.food;
        setForm(f => ({
            ...f,
            food:     entry.food,
            amount:   String(entry.amount),
            unit:     entry.unit,
            foodName: entry.foodName || entry.food,
            calories: String(entry.calories),
            protein:  String(entry.protein),
            carbs:    String(entry.carbs),
            fat:      String(entry.fat),
        }));
        setLookup('found');
        setLookupMsg(`Loaded "${entry.food}"`);
    };

    const handleToggleSave = (entry) => {
        toggleSavedFood(userId, entry);
        setSaved(getSaved(userId));
    };

    const buildQuery = (food, amount, unit) => {
        if (!food?.trim()) return '';
        const amt = parseFloat(amount);
        if (!amt) return food.trim();
        if (unit === 'qty') return `${amt} ${food.trim()}`;
        return `${amt}${unit} ${food.trim()}`;
    };

    useEffect(() => {
        if (!form.food?.trim()) {
            setLookup('idle');
            setLookupMsg('');
            nutritionLockedRef.current = false;
            prevFoodRef.current = '';
            return;
        }
        if (form.food !== prevFoodRef.current) {
            nutritionLockedRef.current = false;
            prevFoodRef.current = form.food;
        }
        if (skipLookupRef.current) { skipLookupRef.current = false; return; }
        if (nutritionLockedRef.current) return;

        setLookup('loading');
        const isQty = form.unit === 'qty';
        const q = isQty ? form.food.trim() : buildQuery(form.food, form.amount, form.unit);
        const qty = isQty ? (parseFloat(form.amount) || 1) : 1;
        const timer = setTimeout(() => runLookup(q, isQty, qty), 500);
        return () => clearTimeout(timer);
    }, [form.food, form.amount, form.unit]);

    const runLookup = async (q, isQty, qty = 1) => {
        try {
            const res = await axios.get(`/api/v1/nutrition/lookup?query=${encodeURIComponent(q)}`, { withCredentials: true });
            const d = res.data.data;
            const round = (v) => Math.round(v * qty * 10) / 10;
            setForm(f => ({
                ...f,
                foodName: d.foodName,
                calories: String(round(d.calories)),
                protein:  String(round(d.protein)),
                carbs:    String(round(d.carbs)),
                fat:      String(round(d.fat)),
            }));
            setLookup('found');
            const label = isQty ? `${qty} × ${d.foodName}` : `${d.grams} g of ${d.foodName}`;
            setLookupMsg(`Found "${d.foodName}"${d.assumed ? ' — assumed 100 g' : ` for ${label}`}`);
        } catch (err) {
            setLookup('error');
            setLookupMsg(err.response?.data?.message || 'Not found — you can still enter values manually.');
            setForm(f => ({ ...f, foodName: q, calories: '', protein: '', carbs: '', fat: '' }));
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/v1/meals/${id}`, { withCredentials: true });
            onUpdate();
        } catch (err) {
            console.error('Delete meal error:', err);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const name = form.foodName.trim() || form.food.trim();
        if (!name) return;
        setSubmitting(true);
        try {
            const cal  = parseFloat(form.calories) || 0;
            const prot = parseFloat(form.protein)  || 0;
            const carb = parseFloat(form.carbs)    || 0;
            const fat  = parseFloat(form.fat)      || 0;

            await axios.post('/api/v1/meals', {
                mealType: form.mealType,
                foodName: name,
                calories: cal,
                protein:  prot,
                carbs:    carb,
                fat:      fat,
                amount:   form.amount || null,
                unit:     form.unit !== 'qty' ? form.unit : null,
            }, { withCredentials: true });

            const entry = {
                food:     form.food || name,
                foodName: name,
                mealType: form.mealType,
                amount:   form.amount,
                unit:     form.unit,
                calories: cal,
                protein:  prot,
                carbs:    carb,
                fat:      fat,
            };
            pushRecent(userId, entry);
            setRecent(getRecent(userId));

            if (isSaved(userId, entry.food)) {
                const list = getSaved(userId).map(f =>
                    f.food.toLowerCase() === entry.food.toLowerCase() ? { ...f, ...entry } : f
                );
                localStorage.setItem(savedKey(userId), JSON.stringify(list));
            }

            closeModal();
            onUpdate();
        } catch (err) {
            console.error('Add meal error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMoveToType = async (mealId, newType) => {
        try {
            await axios.patch(`/api/v1/meals/${mealId}/type`, { mealType: newType }, { withCredentials: true });
            onUpdate();
        } catch { /* silent */ }
    };

    const removeRecent = (entry) => {
        const list = getRecent(userId).filter(f => f.food.toLowerCase() !== entry.food.toLowerCase());
        localStorage.setItem(recentKey(userId), JSON.stringify(list));
        setRecent(list);
    };

    const addMealDirectly = async (entry, mealType) => {
        try {
            await axios.post('/api/v1/meals', {
                mealType,
                foodName: entry.foodName || entry.food,
                calories: entry.calories || 0,
                protein:  entry.protein  || 0,
                carbs:    entry.carbs    || 0,
                fat:      entry.fat      || 0,
                amount:   entry.amount   || null,
                unit:     entry.unit !== 'qty' ? entry.unit : null,
            }, { withCredentials: true });
            pushRecent(userId, { ...entry, mealType });
            setRecent(getRecent(userId));
            onUpdate();
        } catch { /* silent */ }
    };

    const grouped = mealsData?.meals || { breakfast: [], lunch: [], dinner: [], snack: [] };

    return (
        <div className="nutrition-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 18px 16px', height: '100%', boxSizing: 'border-box' }}>
            <div className="nutrition-card-header" style={{ marginBottom: 0 }}>
                <span className="nutrition-section-label">TODAY'S MEALS</span>
                <button onClick={() => openModal()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px',
                        background: 'rgba(165,180,252,0.12)',
                        border: '1px solid rgba(165,180,252,0.25)',
                        borderRadius: 999, color: '#a5b4fc',
                        fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', letterSpacing: '0.02em',
                    }}>
                    <Plus size={12} /> Add meal
                </button>
            </div>

            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
                    {MEAL_TYPES.map(type => (
                        <MealsTimelineRow
                            key={type}
                            type={type}
                            items={grouped[type] || []}
                            openModal={openModal}
                            handleDelete={handleDelete}
                            recentMeals={recent}
                            onGhostClick={addMealDirectly}
                            onGhostRemove={removeRecent}
                            onMoveToType={handleMoveToType}
                        />
                    ))}
                </div>
            )}

            {/* Add Meal Modal */}
            {showModal && (
                <div className="meal-modal-overlay">
                    <div className="meal-modal" onClick={e => e.stopPropagation()}>
                        <div className="meal-modal-header">
                            <h4>Add Meal</h4>
                            <button className="meal-modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>

                        {(recent.length > 0 || saved.length > 0) && (
                            <div className="meal-quick-sections">
                                {saved.length > 0 && (
                                    <div className="meal-quick-section">
                                        <span className="meal-quick-label"><BookmarkCheck size={12} /> Saved</span>
                                        <div className="meal-quick-list">
                                            {saved.map((f, i) => (
                                                <div key={i} className="meal-quick-chip saved" onClick={() => fillFromFood(f)}>
                                                    <span className="meal-quick-chip-name">{f.food}</span>
                                                    {f.amount && <span className="meal-quick-chip-amt">{f.amount}{f.unit && f.unit !== 'qty' ? f.unit : ''}</span>}
                                                    {f.calories > 0 && <span className="meal-quick-chip-cal">{Math.round(f.calories)}kcal</span>}
                                                    <button className="meal-quick-unsave" title="Unsave" onClick={e => { e.stopPropagation(); handleToggleSave(f); }}>
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {recent.length > 0 && (
                                    <div className="meal-quick-section">
                                        <span className="meal-quick-label">Recent</span>
                                        <div className="meal-quick-list">
                                            {recent.map((f, i) => (
                                                <div key={i} className="meal-quick-chip" onClick={() => fillFromFood(f)}>
                                                    <span className="meal-quick-chip-name">{f.food}</span>
                                                    {f.amount && <span className="meal-quick-chip-amt">{f.amount}{f.unit && f.unit !== 'qty' ? f.unit : ''}</span>}
                                                    {f.calories > 0 && <span className="meal-quick-chip-cal">{Math.round(f.calories)}kcal</span>}
                                                    <button className="meal-quick-save" title={isSaved(userId, f.food) ? 'Saved' : 'Save'} onClick={e => { e.stopPropagation(); handleToggleSave(f); setSaved(getSaved(userId)); }}>
                                                        {isSaved(userId, f.food) ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleAdd} className="meal-form">
                            <div className="meal-form-field">
                                <label>Meal Type</label>
                                <select
                                    value={form.mealType}
                                    onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}
                                    className="meal-form-select"
                                >
                                    {MEAL_TYPES.map(t => <option key={t} value={t}>{MEAL_LABELS[t]}</option>)}
                                </select>
                            </div>

                            <div className="meal-form-field">
                                <label>Food</label>
                                <div className="meal-search-wrap">
                                    <input
                                        ref={foodRef}
                                        type="text"
                                        className={`meal-form-input meal-search-input ${lookupState}`}
                                        placeholder="e.g. Chicken breast, Eggs, Oats"
                                        value={form.food}
                                        onChange={e => setForm(f => ({ ...f, food: e.target.value }))}
                                        autoComplete="off"
                                    />
                                    <div className="meal-search-icon">
                                        {lookupState === 'loading' && <div className="meal-search-spinner" />}
                                        {lookupState === 'found'   && <CheckCircle size={16} className="lookup-ok"  />}
                                        {lookupState === 'error'   && <AlertCircle  size={16} className="lookup-err" />}
                                        {lookupState === 'idle'    && <Search size={16} style={{ color: '#bbb' }} />}
                                    </div>
                                </div>
                            </div>

                            <div className="meal-amount-row">
                                <div className="meal-form-field" style={{ flex: 1 }}>
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        className="meal-form-input"
                                        placeholder="e.g. 3 or 300"
                                        min="0"
                                        step="any"
                                        value={form.amount}
                                        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                    />
                                </div>
                                <div className="meal-form-field" style={{ flex: 1 }}>
                                    <label>Unit</label>
                                    <select
                                        className="meal-form-select"
                                        value={form.unit}
                                        onChange={e => {
                                            const newUnit = e.target.value;
                                            setForm(f => ({
                                                ...f,
                                                unit: newUnit,
                                                amount: !f.amount && newUnit !== 'qty' ? '100' : f.amount,
                                            }));
                                        }}
                                    >
                                        {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {lookupMsg && (
                                <div className={`lookup-msg ${lookupState}`}>{lookupMsg}</div>
                            )}
                            <div className="meal-search-hint">
                                Nutrition is looked up automatically. Use "qty" for pieces (eggs, apples…).
                            </div>

                            <div className="meal-form-row">
                                <div className="meal-form-field">
                                    <label>Calories (kcal)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.calories} onChange={e => { nutritionLockedRef.current = true; setForm(f => ({ ...f, calories: e.target.value })); }} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Protein (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.protein} onChange={e => { nutritionLockedRef.current = true; setForm(f => ({ ...f, protein: e.target.value })); }} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Carbs (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.carbs} onChange={e => { nutritionLockedRef.current = true; setForm(f => ({ ...f, carbs: e.target.value })); }} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Fat (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.fat} onChange={e => { nutritionLockedRef.current = true; setForm(f => ({ ...f, fat: e.target.value })); }} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="meal-form-submit"
                                disabled={submitting || (!form.food?.trim())}
                            >
                                {submitting ? 'Adding...' : 'Add Meal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
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
                    userId={userId}
                />
            </div>
        </div>
    );
};

export default Nutrition;
