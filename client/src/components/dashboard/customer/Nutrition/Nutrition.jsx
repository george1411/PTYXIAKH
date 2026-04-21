import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, X, Search, AlertCircle, CheckCircle, Bookmark, BookmarkCheck } from 'lucide-react';
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

// ─── SVG Circular Macro Ring ──────────────────────────────────
const MacroRing = ({ label, value, target, gradFrom, gradTo, labelColor, unit }) => {
    const r = 38;
    const circ = 2 * Math.PI * r;
    const pct = target > 0 ? Math.min(value / target, 1) : 0;
    const offset = circ - pct * circ;
    const gradId = `grad-${label.toLowerCase()}`;

    return (
        <div className="macro-ring-item">
            <svg width="104" height="104" viewBox="0 0 104 104">
                <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradFrom} />
                        <stop offset="100%" stopColor={gradTo} />
                    </linearGradient>
                </defs>
                <circle cx="52" cy="52" r={r} fill="none" stroke="#2a2a2a" strokeWidth="7" />
                <circle
                    cx="52" cy="52" r={r}
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth="7"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 52 52)"
                    style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                />
                <text x="52" y="49" textAnchor="middle" fontSize="15" fontWeight="800" fill="#f0f0f0">
                    {Math.round(value)}
                </text>
                <text x="52" y="63" textAnchor="middle" fontSize="9" fill="#666">
                    / {Math.round(target)} {unit}
                </text>
            </svg>
            <div className="macro-ring-label" style={{ color: labelColor }}>{label}</div>
        </div>
    );
};

// ─── Daily Macro Tracker ──────────────────────────────────────
const DailyMacroTracker = ({ mealsData, balanceData, loading }) => {
    const totals = mealsData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const calTarget = balanceData?.target || 2500;
    const proteinTarget = balanceData?.proteinTarget || 150;
    const carbsTarget = Math.round(calTarget * 0.45 / 4);
    const fatTarget = Math.round(calTarget * 0.25 / 9);

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <h3>Daily Macro Tracker</h3>
                </div>
            </div>
            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <div className="macro-rings-row">
                    <MacroRing label="Calories" value={totals.calories} target={calTarget}     gradFrom="#555"    gradTo="#e0e0e0" labelColor="#e0e0e0" unit="kcal" />
                    <MacroRing label="Protein"  value={totals.protein}  target={proteinTarget} gradFrom="#334"    gradTo="#a5b4fc" labelColor="#a5b4fc" unit="g" />
                    <MacroRing label="Carbs"    value={totals.carbs}    target={carbsTarget}   gradFrom="#1e3a5f" gradTo="#38bdf8" labelColor="#38bdf8" unit="g" />
                    <MacroRing label="Fat"      value={totals.fat}      target={fatTarget}     gradFrom="#2a1a3a" gradTo="#c084fc" labelColor="#c084fc" unit="g" />
                </div>
            )}
        </div>
    );
};

// ─── Calorie Balance Card ─────────────────────────────────────
const CalorieBalanceCard = ({ balanceData, loading }) => {
    const data = balanceData;
    const statusClass = !data ? '' : data.status === 'surplus' ? 'surplus' : data.status === 'deficit' ? 'deficit' : 'on-target';
    const statusLabel = !data ? '' : data.status === 'surplus' ? 'Surplus' : data.status === 'deficit' ? 'Deficit' : 'On Target';

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <h3>Calorie Balance</h3>
                </div>
            </div>
            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : !data ? (
                <div className="nutrition-empty"><p>No data available</p></div>
            ) : (
                <div className="balance-content">
                    <div className="balance-row">
                        <div className="balance-stat">
                            <span className="balance-stat-label">Consumed</span>
                            <span className="balance-stat-value">{Math.round(data.consumed)}</span>
                            <span className="balance-stat-unit">kcal</span>
                        </div>
                        <div className="balance-divider">vs</div>
                        <div className="balance-stat">
                            <span className="balance-stat-label">Target</span>
                            <span className="balance-stat-value">{Math.round(data.target)}</span>
                            <span className="balance-stat-unit">kcal</span>
                        </div>
                    </div>
                    <div className={`balance-result ${statusClass}`}>
                        <span className="balance-result-value">
                            {data.balance > 0 ? '+' : ''}{Math.round(data.balance)} kcal
                        </span>
                        <span className="balance-result-label">{statusLabel}</span>
                    </div>
                    <div className="balance-protein-row">
                        <span className="balance-protein-label">Protein</span>
                        <div className="balance-protein-bar-wrap">
                            <div
                                className="balance-protein-bar"
                                style={{ width: `${Math.min((data.proteinConsumed / (data.proteinTarget || 150)) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="balance-protein-values">
                            {Math.round(data.proteinConsumed)}g / {data.proteinTarget}g
                        </span>
                    </div>
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
                    <h3>Nutrition History</h3>
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
                            <YAxis tick={{ fontSize: 11, fill: '#555' }} tickLine={false} axisLine={false} width={40} />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#888' }} />
                            <Bar dataKey="Calories" fill="#e0e0e0" radius={[3, 3, 0, 0]}>
                                <LabelList dataKey="Calories" position="top" style={{ fill: '#e0e0e0', fontSize: 10, fontWeight: 600 }} />
                            </Bar>
                            <Bar dataKey="Protein" fill="#818CF8" radius={[3, 3, 0, 0]}>
                                <LabelList dataKey="Protein" position="top" style={{ fill: '#818CF8', fontSize: 10, fontWeight: 600 }} />
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

// ─── Water Intake Tracker ─────────────────────────────────────
export const WaterIntakeTracker = () => {
    const [glasses, setGlasses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get('/api/v1/dailylogs/today', { withCredentials: true })
            .then(res => setGlasses(res.data.data?.waterIntake || 0))
            .catch(err => console.error('Water intake error:', err))
            .finally(() => setLoading(false));
    }, []);

    const handleGlassClick = async (index) => {
        // Clicking the last filled glass unfills it, otherwise fill up to clicked
        const newVal = glasses === index + 1 ? index : index + 1;
        setSaving(true);
        try {
            await axios.post('/api/v1/dailylogs/water', { glasses: newVal }, { withCredentials: true });
            setGlasses(newVal);
        } catch (err) {
            console.error('Water update error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <h3>Water Intake</h3>
                </div>
                <span className="nutrition-subtext">{glasses} / 8 glasses</span>
            </div>
            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <div className="water-content">
                    <div className="water-glasses-grid">
                        {Array.from({ length: 8 }, (_, i) => (
                            <button
                                key={i}
                                className={`water-glass-btn ${i < glasses ? 'filled' : ''}`}
                                onClick={() => handleGlassClick(i)}
                                disabled={saving}
                                title={i < glasses ? 'Click to unfill' : 'Click to fill'}
                            >
                                <span className="water-glass-icon"></span>
                            </button>
                        ))}
                    </div>
                    <div className="water-progress-bar">
                        <div className="water-progress-fill" style={{ width: `${(glasses / 8) * 100}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Meal Logger ──────────────────────────────────────────────
const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

// ─── localStorage helpers for recent / saved foods ────────────
const RECENT_KEY = 'gymlit_recent_foods';
const SAVED_KEY  = 'gymlit_saved_foods';

const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
const getSaved  = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY))  || []; } catch { return []; } };

const pushRecent = (entry) => {
    const list = getRecent().filter(f => f.food.toLowerCase() !== entry.food.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry, ...list].slice(0, 8)));
};

const toggleSavedFood = (entry) => {
    const list = getSaved();
    const exists = list.find(f => f.food.toLowerCase() === entry.food.toLowerCase());
    if (exists) localStorage.setItem(SAVED_KEY, JSON.stringify(list.filter(f => f.food.toLowerCase() !== entry.food.toLowerCase())));
    else         localStorage.setItem(SAVED_KEY, JSON.stringify([entry, ...list]));
};

const isSaved = (food) => getSaved().some(f => f.food.toLowerCase() === food.toLowerCase());

const UNITS = [
    { value: 'qty', label: 'qty' },
    { value: 'g',   label: 'g' },
    { value: 'ml',  label: 'ml' },
    { value: 'oz',  label: 'oz' },
    { value: 'cup', label: 'cup' },
    { value: 'tbsp',label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
];

const EMPTY_FORM = { mealType: 'breakfast', food: '', amount: '', unit: 'g', foodName: '', calories: '', protein: '', carbs: '', fat: '' };

const MealLogger = ({ mealsData, onUpdate, loading }) => {
    const [showModal, setShowModal]   = useState(false);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [lookupState, setLookup]    = useState('idle');
    const [lookupMsg, setLookupMsg]   = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recent, setRecent]         = useState([]);
    const [saved, setSaved]           = useState([]);
    const [dragOverType, setDragOverType] = useState(null);
    const foodRef = useRef(null);

    const openModal = () => {
        setRecent(getRecent());
        setSaved(getSaved());
        setShowModal(true);
        setTimeout(() => foodRef.current?.focus(), 50);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setLookup('idle');
        setLookupMsg('');
    };

    // Fill form from a recent/saved entry
    const fillFromFood = (entry) => {
        setForm(f => ({
            ...f,
            food:     entry.food,
            amount:   entry.amount,
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
        toggleSavedFood(entry);
        setSaved(getSaved());
    };

    // Build the API query from food + amount + unit
    const buildQuery = (food, amount, unit) => {
        if (!food?.trim()) return '';
        const amt = parseFloat(amount);
        if (!amt) return food.trim();
        if (unit === 'qty') return `${amt} ${food.trim()}`;   // "3 eggs"
        return `${amt}${unit} ${food.trim()}`;                 // "300g chicken breast"
    };

    // Auto-lookup when food, amount, or unit changes (500 ms debounce)
    useEffect(() => {
        if (!form.food?.trim()) { setLookup('idle'); setLookupMsg(''); return; }
        setLookup('loading');
        const isQty = form.unit === 'qty';
        // For qty: always look up 1 unit so we can multiply by amount ourselves
        // For weight/volume: include amount in query (e.g. "300g chicken")
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

    // ── Drag & Drop handlers ─────────────────────────────────────
    const handleDragStart = (e, meal, fromType) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id: meal.id, fromType }));
        e.dataTransfer.effectAllowed = 'move';
        // Position the drag ghost where the cursor is on the element
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setDragImage(e.currentTarget, offsetX, offsetY);
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDragOverType(null);
    };

    const handleDragOver = (e, type) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverType(type);
    };

    const handleDragLeave = () => setDragOverType(null);

    const handleDrop = async (e, toType) => {
        e.preventDefault();
        setDragOverType(null);
        try {
            const { id, fromType } = JSON.parse(e.dataTransfer.getData('application/json'));
            if (fromType === toType) return;
            await axios.patch(`/api/v1/meals/${id}/type`, { mealType: toType }, { withCredentials: true });
            onUpdate();
        } catch (err) {
            console.error('Move meal error:', err);
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
            await axios.post('/api/v1/meals', {
                mealType: form.mealType,
                foodName: name,
                calories: parseFloat(form.calories) || 0,
                protein:  parseFloat(form.protein)  || 0,
                carbs:    parseFloat(form.carbs)     || 0,
                fat:      parseFloat(form.fat)       || 0,
            }, { withCredentials: true });
            // Save to recent
            pushRecent({
                food:     form.food || name,
                foodName: name,
                amount:   form.amount,
                unit:     form.unit,
                calories: parseFloat(form.calories) || 0,
                protein:  parseFloat(form.protein)  || 0,
                carbs:    parseFloat(form.carbs)    || 0,
                fat:      parseFloat(form.fat)      || 0,
            });
            closeModal();
            onUpdate();
        } catch (err) {
            console.error('Add meal error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const grouped = mealsData?.meals || { breakfast: [], lunch: [], dinner: [], snack: [] };

    return (
        <div className="nutrition-card">
            <div className="nutrition-card-header">
                <div className="nutrition-card-title">
                    <h3>Meal Logger</h3>
                </div>
                <button className="nutrition-add-btn" onClick={openModal}>
                    <Plus size={15} /> Add Meal
                </button>
            </div>

            {loading ? (
                <div className="nutrition-loading"><div className="nutrition-spinner" /></div>
            ) : (
                <div className="meal-groups">
                    {MEAL_TYPES.map(type => (
                        <div
                            key={type}
                            className={`meal-group ${dragOverType === type ? 'drag-over' : ''}`}
                            onDragOver={e => handleDragOver(e, type)}
                            onDragLeave={handleDragLeave}
                            onDrop={e => handleDrop(e, type)}
                        >
                            <div className="meal-group-header">
                                <span className="meal-group-label">{MEAL_LABELS[type]}</span>
                                <span className="meal-group-cal">
                                    {grouped[type].reduce((s, m) => s + (m.calories || 0), 0)} kcal
                                </span>
                            </div>
                            {grouped[type].length === 0 ? (
                                <div className="meal-empty">Nothing logged yet</div>
                            ) : (
                                <div className="meal-list">
                                    {grouped[type].map(meal => (
                                        <div
                                            key={meal.id}
                                            className="meal-item"
                                            draggable
                                            onDragStart={e => handleDragStart(e, meal, type)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="meal-item-name-wrap">
                                                <span className="meal-item-name">{meal.foodName}</span>
                                                <div className="meal-item-tooltip">
                                                    <div className="meal-tooltip-name">{meal.foodName}</div>
                                                    <div className="meal-tooltip-row">
                                                        <span className="meal-tooltip-chip cal">{meal.calories} kcal</span>
                                                        <span className="meal-tooltip-chip prot">{meal.protein}g protein</span>
                                                        <span className="meal-tooltip-chip carb">{meal.carbs}g carbs</span>
                                                        <span className="meal-tooltip-chip fat">{meal.fat}g fat</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="meal-delete-btn" onClick={() => handleDelete(meal.id)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Meal Modal */}
            {showModal && (
                <div className="meal-modal-overlay" onClick={closeModal}>
                    <div className="meal-modal" onClick={e => e.stopPropagation()}>
                        <div className="meal-modal-header">
                            <h4>Add Meal</h4>
                            <button className="meal-modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>

                        {/* Recent & Saved quick-select */}
                        {(recent.length > 0 || saved.length > 0) && (
                            <div className="meal-quick-sections">
                                {saved.length > 0 && (
                                    <div className="meal-quick-section">
                                        <span className="meal-quick-label"><BookmarkCheck size={12} /> Saved</span>
                                        <div className="meal-quick-list">
                                            {saved.map((f, i) => (
                                                <div key={i} className="meal-quick-chip saved" onClick={() => fillFromFood(f)}>
                                                    <span className="meal-quick-chip-name">{f.food}</span>
                                                    <span className="meal-quick-chip-amt">{f.amount}{f.unit !== 'qty' ? f.unit : 'x'}</span>
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
                                                    <span className="meal-quick-chip-amt">{f.amount}{f.unit !== 'qty' ? f.unit : 'x'}</span>
                                                    <button className="meal-quick-save" title={isSaved(f.food) ? 'Saved' : 'Save'} onClick={e => { e.stopPropagation(); handleToggleSave(f); setSaved(getSaved()); }}>
                                                        {isSaved(f.food) ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleAdd} className="meal-form">
                            {/* Meal type selector */}
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

                            {/* Food name */}
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

                            {/* Amount + Unit */}
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
                                        onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
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

                            {/* Auto-filled macro fields (editable) */}
                            <div className="meal-form-row">
                                <div className="meal-form-field">
                                    <label>Calories (kcal)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Protein (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Carbs (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
                                </div>
                                <div className="meal-form-field">
                                    <label>Fat (g)</label>
                                    <input type="number" className="meal-form-input" placeholder="—" min="0" step="any"
                                        value={form.fat} onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
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
const Nutrition = () => {
    const [mealsData,    setMealsData]    = useState(null);
    const [balanceData,  setBalanceData]  = useState(null);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [loadingBal,   setLoadingBal]   = useState(true);

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
            <div className="nutrition-header">
                <h2>Nutrition</h2>
            </div>
            <div className="nutrition-grid">
                {/* Row 1: macro rings | meal logger */}
                <DailyMacroTracker
                    mealsData={mealsData}
                    balanceData={balanceData}
                    loading={loadingMeals || loadingBal}
                />
                <MealLogger mealsData={mealsData} onUpdate={handleMealUpdate} loading={loadingMeals} />
                {/* Row 2: water intake | history */}
                <WaterIntakeTracker />
                <NutritionHistoryChart />
            </div>
        </div>
    );
};

export default Nutrition;