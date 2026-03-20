import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    Search, ChevronRight, Trash2, Plus, Save, X, Loader2, Send,
    Upload, Download, BookMarked, Copy, CheckCircle
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
const WEEK_DATES = getWeekDates();

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
    const [templates, setTemplates]         = useState([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false); // 'save' | 'load' | false
    const [templateName, setTemplateName]   = useState('');
    const [savingTpl, setSavingTpl]         = useState(false);
    const [loadingTpls, setLoadingTpls]     = useState(false);
    const importRef = useRef(null);

    const fetchTemplates = async () => {
        setLoadingTpls(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates', { withCredentials: true });
            setTemplates(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingTpls(false); }
    };

    // Export current full program as JSON file
    const handleExport = () => {
        const blob = new Blob([JSON.stringify(program, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `program_client${clientId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import program from uploaded JSON file and apply to client
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const days = JSON.parse(ev.target.result);
                if (!Array.isArray(days)) return alert('Invalid program file.');
                for (const w of days) {
                    if (!w.day || !w.name) continue;
                    await axios.post(
                        `/api/v1/trainer/clients/${clientId}/program`,
                        { day: w.day, name: w.name, exercises: w.exercises || [] },
                        { withCredentials: true }
                    );
                }
                await loadProgram();
            } catch (err) {
                alert('Failed to import: ' + (err.message || 'unknown error'));
            }
        };
        reader.readAsText(file);
        e.target.value = '';
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
            const days = res.data.data.programData || [];
            for (const w of days) {
                if (!w.day || !w.name) continue;
                await axios.post(
                    `/api/v1/trainer/clients/${clientId}/program`,
                    { day: w.day, name: w.name, exercises: w.exercises || [] },
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
                <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                <button className="tc-tpl-btn" onClick={handleExport} title="Export program as JSON">
                    <Download size={14} /> Export
                </button>
                <button className="tc-tpl-btn" onClick={() => importRef.current?.click()} title="Import program from JSON">
                    <Upload size={14} /> Import
                </button>
                <button className="tc-tpl-btn" onClick={() => { setShowTemplateModal('save'); }} title="Save as template">
                    <Save size={14} /> Save Template
                </button>
                <button className="tc-tpl-btn" onClick={() => { fetchTemplates(); setShowTemplateModal('load'); }} title="Load a saved template">
                    <BookMarked size={14} /> Load Template
                </button>
            </div>

            {/* Save-as-template modal */}
            {showTemplateModal === 'save' && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Save Program as Template</span>
                            <button onClick={() => setShowTemplateModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">Give this week's program a name to save it for future use.</p>
                        <input
                            className="tc-tpl-name-input"
                            placeholder="e.g. Beginner Strength 4-day"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                            autoFocus
                        />
                        <button className="tc-tpl-confirm-btn" onClick={handleSaveTemplate} disabled={savingTpl || !templateName.trim()}>
                            {savingTpl ? <Loader2 className="tc-spin" size={14} /> : <Save size={14} />} Save
                        </button>
                    </div>
                </div>
            )}

            {/* Load-template modal */}
            {showTemplateModal === 'load' && (
                <div className="tc-tpl-modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="tc-tpl-modal" onClick={e => e.stopPropagation()}>
                        <div className="tc-tpl-modal-header">
                            <span>Load a Template</span>
                            <button onClick={() => setShowTemplateModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tc-tpl-modal-hint">Selecting a template will overwrite this client's current program.</p>
                        {loadingTpls ? (
                            <div className="tc-tpl-loading"><Loader2 className="tc-spin" size={20} /></div>
                        ) : templates.length === 0 ? (
                            <div className="tc-tpl-empty">No saved templates yet.</div>
                        ) : (
                            <div className="tc-tpl-list">
                                {templates.map(t => (
                                    <div key={t.id} className="tc-tpl-item" onClick={() => handleLoadTemplate(t.id)}>
                                        <span className="tc-tpl-item-name">{t.name}</span>
                                        <span className="tc-tpl-item-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                                        <button className="tc-tpl-item-del" onClick={e => handleDeleteTemplate(t.id, e)} title="Delete">
                                            <Trash2 size={13} />
                                        </button>
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
                                    <div className="tc-exercise-field tc-exercise-field-notes">
                                        <label>Notes</label>
                                        <input
                                            type="text" placeholder="Optional…"
                                            value={ex.notes ?? ''}
                                            onChange={e => updateExercise(i, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add exercise */}
                <div className="tc-add-exercise-wrap" ref={searchRef}>
                    {showExSearch ? (
                        <div className="tc-ex-search-box">
                            <div className="tc-ex-search-input-wrap">
                                <Search size={14} />
                                <input
                                    autoFocus
                                    placeholder="Search exercises…"
                                    value={exSearch}
                                    onChange={e => setExSearch(e.target.value)}
                                />
                                <button onClick={() => setShowExSearch(false)}><X size={14} /></button>
                            </div>
                            <div className="tc-ex-results">
                                {exSearch.trim() && (
                                    <button className="tc-ex-custom-item" onClick={addCustomExercise}>
                                        <Plus size={13} />
                                        Add "{exSearch.trim()}" as custom exercise
                                    </button>
                                )}
                                {filteredEx.length === 0 && !exSearch.trim() && (
                                    <div className="tc-ex-none">Type to search or add a custom exercise</div>
                                )}
                                {filteredEx.slice(0, 30).map(ex => (
                                    <button key={ex.id} className="tc-ex-result-item" onClick={() => addExercise(ex)}>
                                        <span className="tc-ex-result-name">{ex.name}</span>
                                        {ex.targetMuscles && (
                                            <span className="tc-ex-result-muscle">{ex.targetMuscles}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <button className="tc-btn-add-exercise" onClick={() => setShowExSearch(true)}>
                            <Plus size={15} /> Add Exercise
                        </button>
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
                    {codes.filter(c => !c.usedBy).length > 0 && (
                        <span className="tc-invite-count">{codes.filter(c => !c.usedBy).length}</span>
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
                                <div key={ic.id} className={`tc-invite-row ${ic.usedBy ? 'used' : ''}`}>
                                    <span className="tc-invite-code">{ic.code}</span>
                                    {ic.usedBy && <span className="tc-invite-label used">Used</span>}
                                    <div className="tc-invite-actions">
                                        {!ic.usedBy && (
                                            <button className="tc-invite-btn" onClick={() => handleCopy(ic.id, ic.code)} title="Copy">
                                                {copiedId === ic.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                                            </button>
                                        )}
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
