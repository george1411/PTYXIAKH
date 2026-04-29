import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Plus, X, Save, Trash2, BookMarked, Pencil } from 'lucide-react';
import './TrainerGroupPrograms.css';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_ABBR = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const TrainerGroupPrograms = ({ groupId }) => {
    const [programs, setPrograms]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selectedProg, setSelectedProg] = useState(null);
    const [programData, setProgramData]   = useState([]);
    const [selectedDay, setSelectedDay]   = useState('Monday');
    const [dirty, setDirty]               = useState(false);
    const [saving, setSaving]             = useState(false);
    const [deleting, setDeleting]         = useState(false);
    const [logs, setLogs]                 = useState([]);
    const [expandedEx, setExpandedEx]     = useState(null);
    const [showNew, setShowNew]           = useState(false);
    const [newName, setNewName]           = useState('');
    const [creating, setCreating]         = useState(false);

    // Exercise search
    const [allExercises, setAllExercises] = useState([]);
    const [exSearch, setExSearch]         = useState('');
    const [showExSearch, setShowExSearch] = useState(false);
    const searchRef = useRef(null);

    // Rename
    const [renaming, setRenaming]   = useState(false);
    const [renameVal, setRenameVal] = useState('');

    // Template modals
    const [templates, setTemplates]               = useState([]);
    const [dayTemplates, setDayTemplates]         = useState([]);
    const [showTplModal, setShowTplModal]         = useState(false); // 'save-day'|'load-day'|'save-prog'|'load-prog'|false
    const [tplName, setTplName]                   = useState('');
    const [savingTpl, setSavingTpl]               = useState(false);
    const [loadingTpls, setLoadingTpls]           = useState(false);

    useEffect(() => {
        axios.get('/api/v1/exercises', { withCredentials: true })
            .then(r => setAllExercises(r.data.data || r.data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowExSearch(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchPrograms = useCallback(async () => {
        try {
            const res = await axios.get(`/api/v1/groups/${groupId}/programs`, { withCredentials: true });
            setPrograms(res.data.data || []);
        } catch { /* silent */ }
    }, [groupId]);

    useEffect(() => {
        setLoading(true);
        fetchPrograms().finally(() => setLoading(false));
    }, [fetchPrograms]);

    const selectProgram = async (p) => {
        setSelectedProg(p);
        setDirty(false);
        setExpandedEx(null);
        setSelectedDay('Monday');
        setExSearch('');
        setShowExSearch(false);
        try {
            const [progRes, logsRes] = await Promise.all([
                axios.get(`/api/v1/groups/${groupId}/programs/${p.id}`, { withCredentials: true }),
                axios.get(`/api/v1/groups/${groupId}/programs/${p.id}/logs`, { withCredentials: true }),
            ]);
            setProgramData(progRes.data.data.programData || []);
            setLogs(logsRes.data.data || []);
        } catch { /* silent */ }
    };

    const handleCreate = async () => {
        if (!newName.trim() || creating) return;
        setCreating(true);
        try {
            const initData = DAYS.map(day => ({ day, exercises: [] }));
            const res = await axios.post(`/api/v1/groups/${groupId}/programs`,
                { name: newName.trim() }, { withCredentials: true });
            await fetchPrograms();
            setShowNew(false);
            setNewName('');
            // select the new program
            const prog = { id: res.data.data.id, name: res.data.data.name };
            setSelectedProg(prog);
            setDirty(false);
            setProgramData(initData);
            setLogs([]);
        } catch { /* silent */ } finally { setCreating(false); }
    };

    const handleSave = async () => {
        if (!dirty || saving || !selectedProg) return;
        setSaving(true);
        try {
            await axios.put(`/api/v1/groups/${groupId}/programs/${selectedProg.id}`,
                { programData }, { withCredentials: true });
            setDirty(false);
        } catch { /* silent */ } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!selectedProg || deleting) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/v1/groups/${groupId}/programs/${selectedProg.id}`, { withCredentials: true });
            setSelectedProg(null);
            setProgramData([]);
            await fetchPrograms();
        } catch { /* silent */ } finally { setDeleting(false); }
    };

    const handleRename = async () => {
        if (!renameVal.trim() || !selectedProg) return;
        try {
            await axios.put(`/api/v1/groups/${groupId}/programs/${selectedProg.id}`,
                { name: renameVal.trim() }, { withCredentials: true });
            setSelectedProg(p => ({ ...p, name: renameVal.trim() }));
            setPrograms(ps => ps.map(p => p.id === selectedProg.id ? { ...p, name: renameVal.trim() } : p));
            setRenaming(false);
        } catch { /* silent */ }
    };

    // ── Exercise helpers ──
    const dayObj = programData.find(d => d.day === selectedDay) || { day: selectedDay, exercises: [] };
    const exercises = dayObj.exercises || [];

    const addExercise = (ex) => {
        setProgramData(prev => prev.map(d =>
            d.day !== selectedDay ? d : {
                ...d, exercises: [...d.exercises, {
                    exerciseId: ex.id || null,
                    exerciseName: ex.name,
                    targetMuscles: ex.targetMuscles || '',
                    sets: 3, reps: '10', weight: '', notes: ''
                }]
            }
        ));
        setExSearch(''); setShowExSearch(false); setDirty(true);
    };

    const addCustomExercise = () => {
        if (!exSearch.trim()) return;
        addExercise({ id: null, name: exSearch.trim(), targetMuscles: '' });
    };

    const updateExercise = (idx, field, value) => {
        setProgramData(prev => prev.map(d =>
            d.day !== selectedDay ? d : {
                ...d, exercises: d.exercises.map((ex, i) => i !== idx ? ex : { ...ex, [field]: value })
            }
        ));
        setDirty(true);
    };

    const removeExercise = (idx) => {
        setProgramData(prev => prev.map(d =>
            d.day !== selectedDay ? d : { ...d, exercises: d.exercises.filter((_, i) => i !== idx) }
        ));
        setDirty(true);
    };

    const filteredEx = allExercises.filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase()));

    // ── Template handlers ──
    const fetchWeekTemplates = async () => {
        setLoadingTpls(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates?type=week', { withCredentials: true });
            setTemplates(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingTpls(false); }
    };

    const fetchDayTemplates = async () => {
        setLoadingTpls(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates?type=day', { withCredentials: true });
            setDayTemplates(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingTpls(false); }
    };

    const handleSaveDay = async () => {
        if (!tplName.trim() || savingTpl) return;
        setSavingTpl(true);
        try {
            await axios.post('/api/v1/trainer/templates',
                { name: tplName.trim(), programData: { exercises }, type: 'day' },
                { withCredentials: true });
            setShowTplModal(false);
            setTplName('');
        } catch { /* silent */ } finally { setSavingTpl(false); }
    };

    const handleLoadDay = async (tplId) => {
        try {
            const res = await axios.get(`/api/v1/trainer/templates/${tplId}`, { withCredentials: true });
            const pd = res.data.data.programData;
            const exs = pd?.exercises || [];
            setProgramData(prev => prev.map(d =>
                d.day !== selectedDay ? d : { ...d, exercises: exs }
            ));
            setDirty(true);
            setShowTplModal(false);
        } catch { /* silent */ }
    };

    const handleSaveProgram = async () => {
        if (!tplName.trim() || savingTpl) return;
        setSavingTpl(true);
        try {
            await axios.post('/api/v1/trainer/templates',
                { name: tplName.trim(), programData, type: 'week' },
                { withCredentials: true });
            setShowTplModal(false);
            setTplName('');
        } catch { /* silent */ } finally { setSavingTpl(false); }
    };

    const handleLoadWorkout = async (tplId) => {
        try {
            const res = await axios.get(`/api/v1/trainer/templates/${tplId}`, { withCredentials: true });
            const loaded = res.data.data.programData || [];
            if (!Array.isArray(loaded) || loaded.length === 0) {
                alert('This program has no days configured yet.');
                return;
            }
            setProgramData(DAYS.map(day => {
                const found = loaded.find(w => w.day === day);
                return { day, exercises: found?.exercises || [] };
            }));
            setDirty(true);
            setShowTplModal(false);
        } catch { /* silent */ }
    };

    // ── Member logs per exercise ──
    const getExerciseLogs = (exerciseName) => {
        const filtered = logs.filter(l => l.dayLabel === selectedDay && l.exerciseName === exerciseName);
        const byUser = {};
        filtered.forEach(l => {
            if (!byUser[l.userId] || new Date(l.loggedAt) > new Date(byUser[l.userId].loggedAt)) byUser[l.userId] = l;
        });
        return Object.values(byUser);
    };

    const totalExercises = programData.reduce((acc, d) => acc + (d.exercises?.length || 0), 0);

    return (
        <div className="tgp-container">
            {/* ── Left ── */}
            <div className="tgp-left">
                <button className="tgp-new-btn" onClick={() => setShowNew(true)}>
                    <Plus size={14} /> New Program
                </button>
                {loading ? (
                    <div className="tgp-left-loading"><Loader2 className="tgp-spin" size={18} /></div>
                ) : programs.length === 0 ? (
                    <p className="tgp-left-empty">No programs yet</p>
                ) : programs.map(p => (
                    <button
                        key={p.id}
                        className={`tgp-program-item ${selectedProg?.id === p.id ? 'active' : ''}`}
                        onClick={() => selectProgram(p)}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* ── Right ── */}
            <div className="tgp-right">
                {!selectedProg ? (
                    <div className="tgp-empty"><p>Select a program or create a new one</p></div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="tgp-prog-header">
                            <div className="tgp-prog-header-info">
                                {renaming ? (
                                    <div className="tgp-rename-wrap">
                                        <input
                                            className="tgp-rename-input"
                                            value={renameVal}
                                            onChange={e => setRenameVal(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                                            autoFocus
                                        />
                                        <button className="tgp-rename-confirm" onClick={handleRename}>✓</button>
                                    </div>
                                ) : (
                                    <div className="tgp-title-group">
                                        <h3>{selectedProg.name}</h3>
                                        <button className="tgp-rename-trigger" onClick={() => { setRenameVal(selectedProg.name); setRenaming(true); }} title="Rename">
                                            <Pencil size={12} />
                                        </button>
                                    </div>
                                )}
                                <span>{totalExercises} exercise{totalExercises !== 1 ? 's' : ''} across week</span>
                            </div>
                            <div className="tgp-prog-header-actions">
                                <button className="tgp-tpl-btn" onClick={() => { setTplName(''); setShowTplModal('save-day'); }}>
                                    <Save size={13} /> Save Day
                                </button>
                                <button className="tgp-tpl-btn" onClick={() => { fetchDayTemplates(); setShowTplModal('load-day'); }}>
                                    <BookMarked size={13} /> Load Day
                                </button>
                                <button className="tgp-tpl-btn" onClick={() => { setTplName(''); setShowTplModal('save-prog'); }}>
                                    <Save size={13} /> Save Program
                                </button>
                                <button className="tgp-tpl-btn" onClick={() => { fetchWeekTemplates(); setShowTplModal('load-prog'); }}>
                                    <BookMarked size={13} /> Load Workout
                                </button>
                                <button className="tgp-save-btn" onClick={handleSave} disabled={!dirty || saving}>
                                    {saving ? <Loader2 className="tgp-spin" size={13} /> : <Save size={13} />}
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button className="tgp-del-btn" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? <Loader2 className="tgp-spin" size={13} /> : <Trash2 size={13} />}
                                </button>
                            </div>
                        </div>

                        {/* Day tabs */}
                        <div className="tgp-day-tabs">
                            {DAYS.map((d, i) => {
                                const count = programData.find(x => x.day === d)?.exercises?.length || 0;
                                return (
                                    <button
                                        key={d}
                                        className={`tgp-day-tab ${selectedDay === d ? 'active' : ''} ${count > 0 ? 'filled' : ''}`}
                                        onClick={() => { setSelectedDay(d); setExpandedEx(null); setExSearch(''); setShowExSearch(false); }}
                                    >
                                        {DAY_ABBR[i]}
                                        {count > 0 && <span className="tgp-day-count">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Exercise list */}
                        <div className="tgp-editor-body">
                            <div className="tgp-day-label">{selectedDay}</div>

                            {exercises.length === 0 && (
                                <p className="tgp-no-exercises">No exercises — add one below</p>
                            )}

                            <div className="tgp-exercise-list">
                                {exercises.map((ex, idx) => {
                                    const exKey = `${selectedDay}|${idx}`;
                                    const expanded = expandedEx === exKey;
                                    const exLogs = getExerciseLogs(ex.exerciseName);
                                    return (
                                        <div key={idx} className="tgp-exercise-card">
                                            <div className="tgp-exercise-row">
                                                <div className="tgp-exercise-name-col">
                                                    <span className="tgp-exercise-idx">{idx + 1}</span>
                                                    <div>
                                                        <div className="tgp-exercise-name">{ex.exerciseName}</div>
                                                        {ex.targetMuscles && <div className="tgp-exercise-muscles">{ex.targetMuscles}</div>}
                                                    </div>
                                                </div>
                                                <div className="tgp-exercise-fields">
                                                    <div className="tgp-field">
                                                        <label>Sets</label>
                                                        <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)} />
                                                    </div>
                                                    <div className="tgp-field">
                                                        <label>Reps</label>
                                                        <input value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} />
                                                    </div>
                                                    <div className="tgp-field">
                                                        <label>Weight</label>
                                                        <input value={ex.weight} onChange={e => updateExercise(idx, 'weight', e.target.value)} placeholder="kg" />
                                                    </div>
                                                </div>
                                                <div className="tgp-exercise-actions">
                                                    <button
                                                        className={`tgp-logs-toggle ${expanded ? 'open' : ''}`}
                                                        onClick={() => setExpandedEx(expanded ? null : exKey)}
                                                        title="Member logs"
                                                    >
                                                        {exLogs.length} logs
                                                    </button>
                                                    <button className="tgp-ex-del" onClick={() => removeExercise(idx)}>
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {expanded && (
                                                <div className="tgp-logs-panel">
                                                    {exLogs.length === 0 ? (
                                                        <p className="tgp-logs-empty">No member logs yet</p>
                                                    ) : (
                                                        <table className="tgp-logs-table">
                                                            <thead>
                                                                <tr><th>Member</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Date</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {exLogs.map(l => (
                                                                    <tr key={l.id}>
                                                                        <td>{l.userName}</td>
                                                                        <td>{l.setsCompleted ?? '—'}</td>
                                                                        <td>{l.repsCompleted ?? '—'}</td>
                                                                        <td>{l.weight ? `${l.weight} kg` : '—'}</td>
                                                                        <td>{new Date(l.loggedAt).toLocaleDateString()}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Exercise search / add */}
                            <div className="tgp-add-exercise" ref={searchRef}>
                                <div className="tgp-ex-input-wrap">
                                    <Plus size={14} className="tgp-ex-input-icon" />
                                    <input
                                        className="tgp-ex-input"
                                        placeholder="Type exercise name…"
                                        value={exSearch}
                                        onChange={e => setExSearch(e.target.value)}
                                        onFocus={() => setShowExSearch(true)}
                                        onKeyDown={e => { if (e.key === 'Enter' && exSearch.trim()) addCustomExercise(); }}
                                    />
                                </div>
                                {showExSearch && (
                                    <div className="tgp-ex-dropdown">
                                        {exSearch.trim() && filteredEx.length === 0 && (
                                            <div className="tgp-ex-dropdown-item tgp-ex-dropdown-custom" onClick={addCustomExercise}>
                                                <Plus size={13} /> Add "{exSearch.trim()}"
                                            </div>
                                        )}
                                        {exSearch.trim() && filteredEx.length > 0 && (
                                            <div className="tgp-ex-dropdown-item tgp-ex-dropdown-custom" onClick={addCustomExercise}>
                                                <Plus size={13} /> Add "{exSearch.trim()}" as new
                                            </div>
                                        )}
                                        {(exSearch.trim() ? filteredEx : allExercises).slice(0, 20).map(ex => (
                                            <div key={ex.id} className="tgp-ex-dropdown-item" onClick={() => addExercise(ex)}>
                                                <span className="tgp-ex-dropdown-name">{ex.name}</span>
                                                {ex.targetMuscles && (
                                                    <span className="tgp-ex-dropdown-muscles">
                                                        {Array.isArray(ex.targetMuscles) ? ex.targetMuscles.join(', ') : ex.targetMuscles}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {allExercises.length === 0 && !exSearch.trim() && (
                                            <div className="tgp-ex-dropdown-empty">Type a name and press Enter to add</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Save Day modal ── */}
            {showTplModal === 'save-day' && (
                <div className="tgp-overlay" onClick={() => setShowTplModal(false)}>
                    <div className="tgp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tgp-modal-header"><h3>Save Day Program</h3><button onClick={() => setShowTplModal(false)}><X size={16} /></button></div>
                        <p className="tgp-modal-hint">Save {selectedDay}'s exercises as a reusable day program.</p>
                        <input className="tgp-modal-input" placeholder="e.g. Push Day A" value={tplName} onChange={e => setTplName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveDay()} autoFocus />
                        <div className="tgp-modal-actions">
                            <button className="tgp-modal-cancel" onClick={() => setShowTplModal(false)}>Cancel</button>
                            <button className="tgp-modal-create" onClick={handleSaveDay} disabled={!tplName.trim() || savingTpl}>
                                {savingTpl ? <Loader2 className="tgp-spin" size={13} /> : <Save size={13} />} Save Day
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Load Day modal ── */}
            {showTplModal === 'load-day' && (
                <div className="tgp-overlay" onClick={() => setShowTplModal(false)}>
                    <div className="tgp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tgp-modal-header"><h3>Load Day Program</h3><button onClick={() => setShowTplModal(false)}><X size={16} /></button></div>
                        <p className="tgp-modal-hint">Select a day program to load into {selectedDay}.</p>
                        {loadingTpls ? <div className="tgp-tpl-loading"><Loader2 className="tgp-spin" size={20} /></div>
                        : dayTemplates.length === 0 ? <div className="tgp-tpl-empty">No day programs yet. Create one in the Programs tab.</div>
                        : <div className="tgp-tpl-list">{dayTemplates.map(t => (
                            <div key={t.id} className="tgp-tpl-item" onClick={() => handleLoadDay(t.id)}>
                                <span>{t.name}</span><span className="tgp-tpl-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}</div>}
                    </div>
                </div>
            )}

            {/* ── Save Program modal ── */}
            {showTplModal === 'save-prog' && (
                <div className="tgp-overlay" onClick={() => setShowTplModal(false)}>
                    <div className="tgp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tgp-modal-header"><h3>Save Program</h3><button onClick={() => setShowTplModal(false)}><X size={16} /></button></div>
                        <p className="tgp-modal-hint">Save the full week as a reusable program template.</p>
                        <input className="tgp-modal-input" placeholder="e.g. Push Pull Legs" value={tplName} onChange={e => setTplName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveProgram()} autoFocus />
                        <div className="tgp-modal-actions">
                            <button className="tgp-modal-cancel" onClick={() => setShowTplModal(false)}>Cancel</button>
                            <button className="tgp-modal-create" onClick={handleSaveProgram} disabled={!tplName.trim() || savingTpl}>
                                {savingTpl ? <Loader2 className="tgp-spin" size={13} /> : <Save size={13} />} Save Program
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Load Workout modal ── */}
            {showTplModal === 'load-prog' && (
                <div className="tgp-overlay" onClick={() => setShowTplModal(false)}>
                    <div className="tgp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tgp-modal-header"><h3>Load Workout</h3><button onClick={() => setShowTplModal(false)}><X size={16} /></button></div>
                        <p className="tgp-modal-hint">Select a weekly program to apply to this group.</p>
                        {loadingTpls ? <div className="tgp-tpl-loading"><Loader2 className="tgp-spin" size={20} /></div>
                        : templates.length === 0 ? <div className="tgp-tpl-empty">No programs yet. Create one in the Programs tab.</div>
                        : <div className="tgp-tpl-list">{templates.map(t => (
                            <div key={t.id} className="tgp-tpl-item" onClick={() => handleLoadWorkout(t.id)}>
                                <span>{t.name}</span><span className="tgp-tpl-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}</div>}
                    </div>
                </div>
            )}

            {/* ── New program modal ── */}
            {showNew && (
                <div className="tgp-overlay" onClick={() => setShowNew(false)}>
                    <div className="tgp-modal" onClick={e => e.stopPropagation()}>
                        <h3>New Group Program</h3>
                        <input
                            className="tgp-modal-input"
                            placeholder="Program name…"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNew(false); }}
                        />
                        <div className="tgp-modal-actions">
                            <button className="tgp-modal-cancel" onClick={() => setShowNew(false)}>Cancel</button>
                            <button className="tgp-modal-create" onClick={handleCreate} disabled={!newName.trim() || creating}>
                                {creating ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerGroupPrograms;
