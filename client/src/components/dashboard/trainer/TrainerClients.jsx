import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    Search, ChevronRight, Trash2, Plus, Save, X, Loader2, Send,
    BookMarked, Copy, CheckCircle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import './TrainerClients.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Dates for Mon–Sun of the current week
const getWeekDates = () => {
    const now = new Date();
    const diff = now.getDay() === 0 ? -6 : 1 - now.getDay(); // offset to Monday
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return DAYS.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
};

// ─── Helpers ─────────────────────────────────────────────────
const lastActiveLabel = (dateStr) => {
    if (!dateStr) return 'Never active';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (diff === 0) return 'Active today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
};

const pct = (val, max) => Math.min(100, max > 0 ? Math.round((val / max) * 100) : 0);

// ─── Sub-components ───────────────────────────────────────────
const KpiCard = ({ label, value, color }) => (
    <div className="tc-kpi">
        <div className="tc-kpi-icon" style={{ background: color }} />
        <div>
            <div className="tc-kpi-value">{value}</div>
            <div className="tc-kpi-label">{label}</div>
        </div>
    </div>
);

const ProgressBar = ({ label, value, max, unit }) => (
    <div className="tc-progress-item">
        <div className="tc-progress-header">
            <span className="tc-progress-label">{label}</span>
            <span className="tc-progress-val">{value} / {max}{unit}</span>
        </div>
        <div className="tc-progress-track">
            <div className="tc-progress-fill" style={{ width: `${pct(value, max)}%` }} />
        </div>
    </div>
);

// ─── Overview Panel ───────────────────────────────────────────
const OverviewPanel = ({ detail }) => {
    if (!detail) return <div className="tc-empty">Select a client to view their overview.</div>;

    const { stats, todayLog, goals, weightHistory, weeklyNutrition } = detail;

    const weightData = (weightHistory || []).map(w => ({
        date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: w.weight
    }));

    const nutritionData = (weeklyNutrition || []).map(n => ({
        day: n.dayName?.slice(0, 3),
        Protein: Math.round(n.protein),
        Carbs:   Math.round(n.carbs),
        Fat:     Math.round(n.fat),
    }));

    return (
        <div className="tc-overview">
            {/* KPI strip */}
            <div className="tc-kpi-row">
                <KpiCard label="Day Streak"   value={`${stats.dayStreak} days`}        color="linear-gradient(135deg,#333,#555)" />
                <KpiCard label="Workouts/wk"  value={stats.weeklyWorkouts}              color="linear-gradient(135deg,#444,#666)" />
                <KpiCard label="Last Weight"  value={weightData.length ? `${weightData[weightData.length-1]?.weight} kg` : '—'} color="linear-gradient(135deg,#555,#777)" />
                <KpiCard label="Compliance"   value={`${stats.complianceScore}%`}      color="linear-gradient(135deg,#666,#888)" />
            </div>

            <div className="tc-overview-grid">
                {/* Today's targets */}
                <div className="tc-card">
                    <h4 className="tc-card-title">Today's Targets</h4>
                    <ProgressBar label="Calories" value={todayLog.caloriesBurned}  max={goals.calories} unit=" kcal" />
                    <ProgressBar label="Protein"  value={todayLog.proteinConsumed} max={goals.protein}  unit="g" />
                    <div className="tc-water-row">
                        <span className="tc-progress-label">Water</span>
                        <span className="tc-progress-val">{todayLog.waterIntake} glasses</span>
                    </div>
                </div>

                {/* Weight trend */}
                <div className="tc-card">
                    <h4 className="tc-card-title">Weight Trend</h4>
                    {weightData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={weightData}>
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={['auto','auto']} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="weight" stroke="#555" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="tc-empty-small">No weight data yet</div>
                    )}
                </div>

                {/* Weekly nutrition */}
                <div className="tc-card tc-card-wide">
                    <h4 className="tc-card-title">This Week's Nutrition</h4>
                    {nutritionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={nutritionData}>
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Protein" stackId="a" fill="#444" />
                                <Bar dataKey="Carbs"   stackId="a" fill="#666" />
                                <Bar dataKey="Fat"     stackId="a" fill="#555" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="tc-empty-small">No nutrition data this week</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Program Panel ────────────────────────────────────────────
const ProgramPanel = ({ clientId }) => {
    const WEEK_DATES = getWeekDates();
    const [program, setProgram]             = useState([]);  // [{id, day, name, exercises:[]}]
    const [selectedDay, setSelectedDay]     = useState('Monday');
    const [editState, setEditState]         = useState({ name: '', exercises: [] });
    const [allExercises, setAllExercises]   = useState([]);
    const [exSearch, setExSearch]           = useState('');
    const [showExSearch, setShowExSearch]   = useState(false);
    const [saving, setSaving]               = useState(false);
    const [deleting, setDeleting]           = useState(false);
    const [loadingProg, setLoadingProg]     = useState(true);
    const searchRef = useRef(null);

    // ── Template state ──────────────────────────────────────────
    const [templates, setTemplates]                 = useState([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false); // 'save' | 'load' | false
    const [templateName, setTemplateName]           = useState('');
    const [savingTpl, setSavingTpl]                 = useState(false);
    const [loadingTpls, setLoadingTpls]             = useState(false);

    // ── Day program state ───────────────────────────────────────
    const [showSaveDayModal, setShowSaveDayModal]   = useState(false);
    const [saveDayName, setSaveDayName]             = useState('');
    const [savingDay, setSavingDay]                 = useState(false);
    const [dayTemplates, setDayTemplates]           = useState([]);
    const [showLoadDayModal, setShowLoadDayModal]   = useState(false);
    const [loadingDayTpls, setLoadingDayTpls]       = useState(false);

    const fetchTemplates = async () => {
        setLoadingTpls(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates?type=week', { withCredentials: true });
            setTemplates(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingTpls(false); }
    };

    const fetchDayTemplates = async () => {
        setLoadingDayTpls(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates?type=day', { withCredentials: true });
            setDayTemplates(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingDayTpls(false); }
    };

    const handleSaveDay = async () => {
        if (!saveDayName.trim()) return;
        setSavingDay(true);
        try {
            await axios.post('/api/v1/trainer/templates',
                { name: saveDayName.trim(), programData: { exercises: editState.exercises }, type: 'day' },
                { withCredentials: true }
            );
            setShowSaveDayModal(false);
            setSaveDayName('');
        } catch (e) { console.error(e); }
        finally { setSavingDay(false); }
    };

    const handleLoadDay = async (tplId) => {
        try {
            const res = await axios.get(`/api/v1/trainer/templates/${tplId}`, { withCredentials: true });
            const data = res.data.data;
            const pd = data.programData;
            setEditState({
                name: pd.name || data.name || '',
                exercises: pd.exercises || []
            });
            setShowLoadDayModal(false);
        } catch (e) { console.error(e); }
    };

    // Save current full program as a named template
    const handleSaveTemplate = async () => {
        if (!templateName.trim()) return;
        setSavingTpl(true);
        try {
            await axios.post('/api/v1/trainer/templates',
                { name: templateName.trim(), programData: program },
                { withCredentials: true }
            );
            setTemplateName('');
            setShowTemplateModal(false);
            await fetchTemplates();
        } catch (e) { console.error(e); }
        finally { setSavingTpl(false); }
    };

    // Apply a saved template to this client
    const handleLoadTemplate = async (tplId) => {
        try {
            const res = await axios.get(`/api/v1/trainer/templates/${tplId}`, { withCredentials: true });
            const days = (res.data.data.programData || []).filter(w => w.day);
            if (days.length === 0) {
                alert('This program has no days configured yet. Add workouts to it in the Programs tab first.');
                return;
            }
            for (const w of days) {
                await axios.post(
                    `/api/v1/trainer/clients/${clientId}/program`,
                    { day: w.day, name: w.name || w.day, exercises: w.exercises || [] },
                    { withCredentials: true }
                );
            }
            setShowTemplateModal(false);
            await loadProgram();
        } catch (e) { console.error(e); }
    };

    const handleDeleteTemplate = async (tplId, e) => {
        e.stopPropagation();
        await axios.delete(`/api/v1/trainer/templates/${tplId}`, { withCredentials: true });
        await fetchTemplates();
    };

    const loadProgram = async () => {
        setLoadingProg(true);
        try {
            const res = await axios.get(`/api/v1/trainer/clients/${clientId}/program`, { withCredentials: true });
            setProgram(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProg(false);
        }
    };

    useEffect(() => {
        loadProgram();
        axios.get('/api/v1/exercises', { withCredentials: true })
            .then(r => setAllExercises(r.data.data || r.data || []))
            .catch(console.error);
    }, [clientId]);

    // Sync editState whenever selectedDay or program changes
    useEffect(() => {
        const workout = program.find(w => w.day === selectedDay);
        if (workout) {
            setEditState({
                name: workout.name,
                exercises: workout.exercises.map(e => ({ ...e }))
            });
        } else {
            setEditState({ name: '', exercises: [] });
        }
    }, [selectedDay, program]);

    const dayWorkout    = program.find(w => w.day === selectedDay);
    const filteredEx    = allExercises.filter(e =>
        e.name.toLowerCase().includes(exSearch.toLowerCase())
    );

    const addExercise = (ex) => {
        setEditState(prev => ({
            ...prev,
            exercises: [...prev.exercises, {
                exerciseId: ex.id || null,
                exerciseName: ex.name,
                targetMuscles: ex.targetMuscles || '',
                sets: 3, reps: '10', weight: '', notes: ''
            }]
        }));
        setExSearch('');
        setShowExSearch(false);
    };

    const addCustomExercise = () => {
        if (!exSearch.trim()) return;
        addExercise({ id: null, name: exSearch.trim(), targetMuscles: '' });
    };

    const removeExercise = (idx) => {
        setEditState(prev => ({
            ...prev,
            exercises: prev.exercises.filter((_, i) => i !== idx)
        }));
    };

    const updateExercise = (idx, field, value) => {
        setEditState(prev => {
            const exs = [...prev.exercises];
            exs[idx] = { ...exs[idx], [field]: value };
            return { ...prev, exercises: exs };
        });
    };

    const handleSave = async () => {
        if (!editState.name.trim()) return;
        setSaving(true);
        try {
            await axios.post(
                `/api/v1/trainer/clients/${clientId}/program`,
                { day: selectedDay, name: editState.name, exercises: editState.exercises },
                { withCredentials: true }
            );
            await loadProgram();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!dayWorkout) return;
        setDeleting(true);
        try {
            await axios.delete(
                `/api/v1/trainer/clients/${clientId}/program/${dayWorkout.id}`,
                { withCredentials: true }
            );
            await loadProgram();
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(false);
        }
    };

    if (loadingProg) return <div className="tc-empty"><Loader2 className="tc-spin" size={24} /> Loading program…</div>;

    return (
        <div className="tc-program">
            {/* Program toolbar */}
            <div className="tc-program-toolbar">
                <button className="tc-tpl-btn" onClick={() => { setSaveDayName(editState.name); setShowSaveDayModal(true); }} title="Save this day as a day program">
                    <Save size={14} /> Save Day
                </button>
                <button className="tc-tpl-btn" onClick={() => { fetchDayTemplates(); setShowLoadDayModal(true); }} title="Load a day program into this day">
                    <BookMarked size={14} /> Load Day
                </button>
                <button className="tc-tpl-btn" onClick={() => { setShowTemplateModal('save'); }} title="Save full week as a program">
                    <Save size={14} /> Save Program
                </button>
                <button className="tc-tpl-btn" onClick={() => { fetchTemplates(); setShowTemplateModal('load'); }} title="Load a saved weekly program">
                    <BookMarked size={14} /> Load Workout
                </button>
            </div>

            {/* Save Program modal */}
            {showTemplateModal === 'save' && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Save as Program</span>
                            <button onClick={() => setShowTemplateModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">This will save the current weekly program to your Programs library.</p>
                        <input
                            className="tc-tpl-name-input"
                            placeholder="e.g. Beginner Strength 4-day"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                            autoFocus
                        />
                        <button className="tc-tpl-confirm-btn" onClick={handleSaveTemplate} disabled={savingTpl || !templateName.trim()}>
                            {savingTpl ? <Loader2 className="tc-spin" size={14} /> : <Save size={14} />} Save Program
                        </button>
                    </div>
                </div>
            )}

            {/* Load Workout modal */}
            {showTemplateModal === 'load' && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Load Workout</span>
                            <button onClick={() => setShowTemplateModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">Select a program to apply to this client's weekly workout.</p>
                        {loadingTpls ? (
                            <div className="tc-tpl-loading"><Loader2 className="tc-spin" size={20} /></div>
                        ) : templates.length === 0 ? (
                            <div className="tc-tpl-empty">No saved programs yet. Create one in the Programs tab.</div>
                        ) : (
                            <div className="tc-tpl-list">
                                {templates.map(t => (
                                    <div key={t.id} className="tc-tpl-item" onClick={() => handleLoadTemplate(t.id)}>
                                        <span className="tc-tpl-item-name">{t.name}</span>
                                        <span className="tc-tpl-item-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Day modal */}
            {showSaveDayModal && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowSaveDayModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Save Day Program</span>
                            <button onClick={() => setShowSaveDayModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">Save this day's workout as a reusable day program.</p>
                        <input
                            className="tc-tpl-name-input"
                            placeholder="e.g. Push Day A"
                            value={saveDayName}
                            onChange={e => setSaveDayName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveDay()}
                            autoFocus
                        />
                        <button className="tc-tpl-confirm-btn" onClick={handleSaveDay} disabled={savingDay || !saveDayName.trim()}>
                            {savingDay ? <Loader2 className="tc-spin" size={14} /> : <Save size={14} />} Save Day
                        </button>
                    </div>
                </div>
            )}

            {/* Load Day modal */}
            {showLoadDayModal && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowLoadDayModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Load Day Program</span>
                            <button onClick={() => setShowLoadDayModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">Select a day program to load into this day.</p>
                        {loadingDayTpls ? (
                            <div className="tc-tpl-loading"><Loader2 className="tc-spin" size={20} /></div>
                        ) : dayTemplates.length === 0 ? (
                            <div className="tc-tpl-empty">No day programs yet. Create one in the Programs tab.</div>
                        ) : (
                            <div className="tc-tpl-list">
                                {dayTemplates.map(t => (
                                    <div key={t.id} className="tc-tpl-item" onClick={() => handleLoadDay(t.id)}>
                                        <span className="tc-tpl-item-name">{t.name}</span>
                                        <span className="tc-tpl-item-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Day pills */}
            <div className="tc-day-pills">
                {DAYS.map((day, i) => {
                    const hasWorkout = program.some(w => w.day === day);
                    return (
                        <button
                            key={day}
                            className={`tc-day-pill ${selectedDay === day ? 'active' : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            {DAY_ABBR[i]} <span className="tc-day-date">{WEEK_DATES[i]}</span>
                            {hasWorkout && <span className="tc-day-dot" />}
                        </button>
                    );
                })}
            </div>

            {/* Editor */}
            <div className="tc-editor">
                <div className="tc-editor-header">
                    <div className="tc-editor-title-row">
                        <span className="tc-editor-day">{selectedDay}</span>
                        <input
                            className="tc-workout-name-input"
                            placeholder="Workout name (e.g. Upper Body)"
                            value={editState.name}
                            onChange={e => setEditState(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>
                    <div className="tc-editor-actions">
                        {dayWorkout && (
                            <button className="tc-btn-danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <Loader2 className="tc-spin" size={14} /> : <Trash2 size={14} />}
                                Rest Day
                            </button>
                        )}
                        <button
                            className="tc-btn-save"
                            onClick={handleSave}
                            disabled={saving || !editState.name.trim()}
                        >
                            {saving ? <Loader2 className="tc-spin" size={14} /> : <Save size={14} />}
                            Save
                        </button>
                    </div>
                </div>

                {/* Exercise list */}
                <div className="tc-exercise-list">
                    {editState.exercises.length === 0 ? (
                        <div className="tc-empty-small">No exercises yet — add one below.</div>
                    ) : (
                        editState.exercises.map((ex, i) => (
                            <div key={i} className="tc-exercise-row">
                                <div className="tc-exercise-row-top">
                                    <div className="tc-exercise-info">
                                        <span className="tc-exercise-name">{ex.exerciseName}</span>
                                        {ex.targetMuscles && (
                                            <span className="tc-exercise-muscle">{ex.targetMuscles}</span>
                                        )}
                                    </div>
                                    <button className="tc-exercise-remove" onClick={() => removeExercise(i)}>
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="tc-exercise-inputs">
                                    <div className="tc-exercise-field">
                                        <label>Sets</label>
                                        <input
                                            type="number" min="1"
                                            value={ex.sets ?? 3}
                                            onChange={e => updateExercise(i, 'sets', e.target.value)}
                                        />
                                    </div>
                                    <div className="tc-exercise-field">
                                        <label>Reps</label>
                                        <input
                                            type="text" placeholder="e.g. 8-12"
                                            value={ex.reps ?? '10'}
                                            onChange={e => updateExercise(i, 'reps', e.target.value)}
                                        />
                                    </div>
                                    <div className="tc-exercise-field">
                                        <label>Weight (kg)</label>
                                        <input
                                            type="number" min="0" placeholder="—"
                                            value={ex.weight ?? ''}
                                            onChange={e => updateExercise(i, 'weight', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add exercise */}
                <div className="tc-add-exercise-wrap" ref={searchRef}>
                    <div className="tc-ex-input-wrap">
                        <Plus size={14} className="tc-ex-input-icon" />
                        <input
                            className="tc-ex-input"
                            placeholder="Type exercise name…"
                            value={exSearch}
                            onChange={e => setExSearch(e.target.value)}
                            onFocus={() => setShowExSearch(true)}
                            onKeyDown={e => { if (e.key === 'Enter' && exSearch.trim()) { addCustomExercise(); } }}
                        />
                    </div>
                    {showExSearch && (
                        <div className="tc-ex-dropdown">
                            {exSearch.trim() && filteredEx.length === 0 && (
                                <button className="tc-ex-dropdown-item tc-ex-dropdown-custom" onClick={addCustomExercise}>
                                    <Plus size={13} /> Add "{exSearch.trim()}"
                                </button>
                            )}
                            {exSearch.trim() && filteredEx.length > 0 && (
                                <button className="tc-ex-dropdown-item tc-ex-dropdown-custom" onClick={addCustomExercise}>
                                    <Plus size={13} /> Add "{exSearch.trim()}" as new
                                </button>
                            )}
                            {(exSearch.trim() ? filteredEx : allExercises).slice(0, 20).map(ex => (
                                <button key={ex.id} className="tc-ex-dropdown-item" onClick={() => addExercise(ex)}>
                                    <span className="tc-ex-dropdown-name">{ex.name}</span>
                                    {ex.targetMuscles && (
                                        <span className="tc-ex-dropdown-muscle">{
                                            Array.isArray(ex.targetMuscles) ? ex.targetMuscles.join(', ') : ex.targetMuscles
                                        }</span>
                                    )}
                                </button>
                            ))}
                            {allExercises.length === 0 && !exSearch.trim() && (
                                <div className="tc-ex-dropdown-empty">Type a name and press Enter to add</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Chat Panel ───────────────────────────────────────────────
const ChatPanel = ({ clientId, clientName, trainerId }) => {
    const [messages, setMessages]   = useState([]);
    const [text, setText]           = useState('');
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const bottomRef                 = useRef(null);
    const pollRef                   = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/api/v1/chat?partnerId=${clientId}`, { withCredentials: true });
            setMessages(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        fetchMessages();
        pollRef.current = setInterval(fetchMessages, 4000);
        return () => clearInterval(pollRef.current);
    }, [clientId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await axios.post('/api/v1/chat', { content: text.trim(), receiverId: clientId }, { withCredentials: true });
            setText('');
            await fetchMessages();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="tc-empty"><Loader2 className="tc-spin" size={24} /> Loading messages…</div>;

    return (
        <div className="tc-chat">
            <div className="tc-chat-messages">
                {messages.length === 0 && (
                    <div className="tc-empty-small">No messages yet. Say hello!</div>
                )}
                {messages.map(msg => {
                    const isMe = msg.senderId !== clientId;
                    return (
                        <div key={msg.id} className={`tc-msg-row ${isMe ? 'me' : 'them'}`}>
                            {!isMe && (
                                <div className="tc-msg-avatar">
                                    {clientName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={`tc-msg-bubble ${isMe ? 'me' : 'them'}`}>
                                <p>{msg.content}</p>
                                <span className="tc-msg-time">{formatTime(msg.createdAt)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <form className="tc-chat-input-row" onSubmit={handleSend}>
                <input
                    className="tc-chat-input"
                    placeholder={`Message ${clientName}…`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={sending}
                />
                <button className="tc-chat-send" type="submit" disabled={sending || !text.trim()}>
                    {sending ? <Loader2 className="tc-spin" size={16} /> : <Send size={16} />}
                </button>
            </form>
        </div>
    );
};

// ─── Invite Codes Panel ───────────────────────────────────────
const InvitePanel = () => {
    const [codes, setCodes]               = useState([]);
    const [generating, setGenerating]     = useState(false);
    const [copiedId, setCopiedId]         = useState(null);
    const [open, setOpen]                 = useState(false);

    const fetchCodes = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/v1/invite', { withCredentials: true });
            setCodes(data.data || []);
        } catch {}
    }, []);

    useEffect(() => { fetchCodes(); }, [fetchCodes]);

    const handleGenerate = async () => {
        setGenerating(true);
        try { await axios.post('/api/v1/invite', {}, { withCredentials: true }); fetchCodes(); }
        catch {} finally { setGenerating(false); }
    };

    const handleDelete = async (id) => {
        try { await axios.delete(`/api/v1/invite/${id}`, { withCredentials: true }); setCodes(prev => prev.filter(c => c.id !== id)); }
        catch {}
    };

    const handleCopy = (id, code) => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="tc-invite-panel">
            <button className="tc-invite-toggle" onClick={() => setOpen(o => !o)}>
                <span>Invite Codes</span>
                <div className="tc-invite-toggle-right">
                    {codes.length > 0 && (
                        <span className="tc-invite-count">{codes.length}</span>
                    )}
                    <span className="tc-invite-chevron">{open ? '▲' : '▼'}</span>
                </div>
            </button>
            {open && (
                <div className="tc-invite-body">
                    {codes.length === 0 ? (
                        <p className="tc-invite-empty">No codes yet.</p>
                    ) : (
                        <div className="tc-invite-list">
                            {codes.map(ic => (
                                <div key={ic.id} className="tc-invite-row">
                                    <span className="tc-invite-code">{ic.code}</span>
                                    {ic.usedCount > 0 && (
                                        <span className="tc-invite-label">{ic.usedCount} client{ic.usedCount !== 1 ? 's' : ''}</span>
                                    )}
                                    <div className="tc-invite-actions">
                                        <button className="tc-invite-btn" onClick={() => handleCopy(ic.id, ic.code)} title="Copy">
                                            {copiedId === ic.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                                        </button>
                                        <button className="tc-invite-btn del" onClick={() => handleDelete(ic.id)} title="Delete">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="tc-invite-generate" onClick={handleGenerate} disabled={generating}>
                        <Plus size={13} /> {generating ? 'Generating…' : 'New Code'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
const TrainerClients = () => {
    const [clients, setClients]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [selectedId, setSelectedId]     = useState(null);
    const [detail, setDetail]             = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [activeTab, setActiveTab]       = useState('overview');

    useEffect(() => {
        axios.get('/api/v1/trainer/clients', { withCredentials: true })
            .then(r => { setClients(r.data.data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const selectClient = async (client) => {
        setSelectedId(client.id);
        setActiveTab('overview');
        setDetail(null);
        setLoadingDetail(true);
        try {
            const res = await axios.get(`/api/v1/trainer/clients/${client.id}`, { withCredentials: true });
            setDetail(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetail(false);
        }
    };

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const selectedClient = clients.find(c => c.id === selectedId);

    return (
        <div className="tc-container">
            <div className="tc-layout">

                {/* ── Left: client list ── */}
                <div className="tc-left">
                    <div className="tc-search-wrap">
                        <Search size={15} className="tc-search-icon" />
                        <input
                            className="tc-search-input"
                            placeholder="Search clients…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="tc-empty"><Loader2 className="tc-spin" size={20} /></div>
                    ) : filtered.length === 0 ? (
                        <div className="tc-empty">
                            <p>{search ? 'No clients match.' : 'No clients assigned yet.'}</p>
                        </div>
                    ) : (
                        <div className="tc-client-list">
                            {filtered.map(c => {
                                const active = c.lastActive
                                    ? Math.floor((Date.now() - new Date(c.lastActive)) / 86400000) === 0
                                    : false;
                                return (
                                    <button
                                        key={c.id}
                                        className={`tc-client-item ${selectedId === c.id ? 'selected' : ''}`}
                                        onClick={() => selectClient(c)}
                                    >
                                        <div className="tc-client-avatar">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="tc-client-info">
                                            <div className="tc-client-name-row">
                                                <span className="tc-client-name">{c.name}</span>
                                                {!c.hasProgram && <span className="tc-no-program-badge">No program</span>}
                                            </div>
                                            <span className="tc-client-sub">{lastActiveLabel(c.lastActive)}</span>
                                        </div>
                                        <div className={`tc-active-dot ${active ? 'online' : 'offline'}`} />
                                        <ChevronRight size={14} className="tc-chevron" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <InvitePanel />
                </div>

                {/* ── Right: detail panel ── */}
                <div className="tc-right">
                    {!selectedClient ? (
                        <div className="tc-no-selection">
                            <p>Select a client from the list</p>
                        </div>
                    ) : (
                        <>
                            {/* Client header */}
                            <div className="tc-client-header">
                                <div className="tc-client-header-avatar">
                                    {selectedClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="tc-client-header-info">
                                    <h2>{selectedClient.name}</h2>
                                    <span>{selectedClient.email}</span>
                                    <div className="tc-client-meta">
                                        {selectedClient.age  && <span>{selectedClient.age} yrs</span>}
                                        {selectedClient.gender && <span>{selectedClient.gender === 'M' ? 'Male' : 'Female'}</span>}
                                        {selectedClient.height && <span>{selectedClient.height} cm</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Inner tabs */}
                            <div className="tc-inner-tabs">
                                <button
                                    className={`tc-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >Overview</button>
                                <button
                                    className={`tc-tab ${activeTab === 'program' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('program')}
                                >Weekly Program</button>
                                <button
                                    className={`tc-tab ${activeTab === 'messages' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('messages')}
                                >Messages</button>
                            </div>

                            {/* Tab content */}
                            {activeTab === 'overview' ? (
                                loadingDetail
                                    ? <div className="tc-empty"><Loader2 className="tc-spin" size={24} /> Loading…</div>
                                    : <OverviewPanel detail={detail} />
                            ) : activeTab === 'program' ? (
                                <ProgramPanel clientId={selectedId} />
                            ) : (
                                <ChatPanel
                                    clientId={selectedId}
                                    clientName={selectedClient.name}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerClients;
