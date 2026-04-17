import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Plus, Trash2, Save, X, Loader2, Search,
    ChevronRight, Upload, Download, Pencil, GripVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './TrainerPrograms.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TrainerPrograms = () => {
    // ── List state ──
    const [templates, setTemplates] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Editor state ──
    const [selectedId, setSelectedId] = useState(null);
    const [programName, setProgramName] = useState('');
    const [program, setProgram] = useState([]); // [{day, name, exercises}]
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [editState, setEditState] = useState({ name: '', exercises: [] });
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // ── Exercise search ──
    const [allExercises, setAllExercises] = useState([]);
    const [exSearch, setExSearch] = useState('');
    const [showExSearch, setShowExSearch] = useState(false);
    const searchRef = useRef(null);
    const importRef = useRef(null);
    const newImportRef = useRef(null);

    // ── Rename state ──
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    // ── Drag state ──
    const [draggingId, setDraggingId] = useState(null);
    const [dropHover, setDropHover] = useState(false);

    // ── New program modal ──
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [creatingNew, setCreatingNew] = useState(false);

    // ── Load templates list ──
    const fetchTemplates = async () => {
        setLoadingList(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates', { withCredentials: true });
            setTemplates(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingList(false); }
    };

    // ── Load exercises DB ──
    useEffect(() => {
        fetchTemplates();
        axios.get('/api/v1/exercises', { withCredentials: true })
            .then(r => setAllExercises(r.data.data || r.data || []))
            .catch(console.error);
    }, []);

    // ── Load a template into editor ──
    const loadTemplate = async (id) => {
        try {
            const res = await axios.get(`/api/v1/trainer/templates/${id}`, { withCredentials: true });
            const data = res.data.data;
            setSelectedId(id);
            setProgramName(data.name);
            setProgram(data.programData || []);
            setSelectedDay('Monday');
            setDirty(false);
        } catch (e) { console.error(e); }
    };

    // ── Sync editState when day or program changes ──
    useEffect(() => {
        const workout = program.find(w => w.day === selectedDay);
        if (workout) {
            setEditState({ name: workout.name, exercises: workout.exercises.map(e => ({ ...e })) });
        } else {
            setEditState({ name: '', exercises: [] });
        }
    }, [selectedDay, program]);

    // ── Close exercise search on outside click ──
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowExSearch(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Save day to local program state ──
    const saveDayToProgram = () => {
        setProgram(prev => {
            const exists = prev.findIndex(w => w.day === selectedDay);
            const dayData = { day: selectedDay, name: editState.name, exercises: editState.exercises };
            if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = { ...updated[exists], ...dayData };
                return updated;
            }
            return [...prev, dayData];
        });
        setDirty(true);
    };

    // ── Save entire template to server ──
    const handleSaveTemplate = async () => {
        // First save current day edits into program
        let currentProgram = program;
        const exists = currentProgram.findIndex(w => w.day === selectedDay);
        const dayData = { day: selectedDay, name: editState.name, exercises: editState.exercises };
        if (exists >= 0) {
            currentProgram = [...currentProgram];
            currentProgram[exists] = { ...currentProgram[exists], ...dayData };
        } else if (editState.name || editState.exercises.length) {
            currentProgram = [...currentProgram, dayData];
        }

        setSaving(true);
        try {
            if (selectedId) {
                await axios.put(`/api/v1/trainer/templates/${selectedId}`,
                    { name: programName, programData: currentProgram },
                    { withCredentials: true }
                );
            } else {
                const res = await axios.post('/api/v1/trainer/templates',
                    { name: programName, programData: currentProgram },
                    { withCredentials: true }
                );
                setSelectedId(res.data.data.id);
            }
            setProgram(currentProgram);
            setDirty(false);
            await fetchTemplates();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    // ── Create new program ──
    const handleCreateNew = async () => {
        if (!newName.trim()) return;
        setCreatingNew(true);
        try {
            const res = await axios.post('/api/v1/trainer/templates',
                { name: newName.trim(), programData: [] },
                { withCredentials: true }
            );
            await fetchTemplates();
            setShowNewModal(false);
            setNewName('');
            loadTemplate(res.data.data.id);
        } catch (e) { console.error(e); }
        finally { setCreatingNew(false); }
    };

    // ── Delete template ──
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`/api/v1/trainer/templates/${id}`, { withCredentials: true });
            if (selectedId === id) {
                setSelectedId(null);
                setProgramName('');
                setProgram([]);
                setDirty(false);
            }
            await fetchTemplates();
        } catch (e) { console.error(e); }
    };

    // ── Rename template ──
    const handleRename = async () => {
        if (!renameValue.trim() || !selectedId) return;
        try {
            await axios.put(`/api/v1/trainer/templates/${selectedId}`,
                { name: renameValue.trim() },
                { withCredentials: true }
            );
            setProgramName(renameValue.trim());
            setRenaming(false);
            await fetchTemplates();
        } catch (e) { console.error(e); }
    };

    // ── Exercise helpers ──
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
        setDirty(true);
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
        setDirty(true);
    };

    const updateExercise = (idx, field, value) => {
        setEditState(prev => {
            const exs = [...prev.exercises];
            exs[idx] = { ...exs[idx], [field]: value };
            return { ...prev, exercises: exs };
        });
        setDirty(true);
    };

    const filteredEx = allExercises.filter(e =>
        e.name.toLowerCase().includes(exSearch.toLowerCase())
    );

    // ── Export as Excel ──
    const handleExport = () => {
        // Save current day first
        let currentProgram = [...program];
        const exists = currentProgram.findIndex(w => w.day === selectedDay);
        const dayData = { day: selectedDay, name: editState.name, exercises: editState.exercises };
        if (exists >= 0) {
            currentProgram[exists] = { ...currentProgram[exists], ...dayData };
        } else if (editState.name || editState.exercises.length) {
            currentProgram.push(dayData);
        }

        const wb = XLSX.utils.book_new();
        for (const day of DAYS) {
            const workout = currentProgram.find(w => w.day === day);
            const rows = [];
            rows.push({ Exercise: `Workout: ${workout?.name || ''}`, Muscles: '', Sets: '', Reps: '', Weight: '', Notes: '' });
            rows.push({});
            if (workout?.exercises?.length) {
                for (const ex of workout.exercises) {
                    rows.push({
                        Exercise: ex.exerciseName || '',
                        Muscles: ex.targetMuscles || '',
                        Sets: ex.sets ?? '',
                        Reps: ex.reps || '',
                        Weight: ex.weight || '',
                        Notes: ex.notes || ''
                    });
                }
            }
            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, ws, day);
        }
        XLSX.writeFile(wb, `${programName || 'program'}.xlsx`);
    };

    // ── Import from Excel ──
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'array' });
                const imported = [];
                for (const sheetName of wb.SheetNames) {
                    const day = DAYS.find(d => d.toLowerCase() === sheetName.toLowerCase());
                    if (!day) continue;
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
                    if (rows.length === 0) continue;
                    const firstRow = rows[0];
                    const nameCell = firstRow.Exercise || firstRow.exercise || Object.values(firstRow)[0] || '';
                    const workoutName = nameCell.replace(/^Workout:\s*/i, '').trim() || day;
                    const exercises = [];
                    for (let i = 1; i < rows.length; i++) {
                        const r = rows[i];
                        const exName = r.Exercise || r.exercise || '';
                        if (!exName || exName.toLowerCase().startsWith('workout:')) continue;
                        exercises.push({
                            exerciseId: null,
                            exerciseName: exName,
                            targetMuscles: r.Muscles || r.muscles || '',
                            sets: parseInt(r.Sets || r.sets) || 3,
                            reps: String(r.Reps || r.reps || '10'),
                            weight: String(r.Weight || r.weight || ''),
                            notes: r.Notes || r.notes || ''
                        });
                    }
                    imported.push({ day, name: workoutName, exercises });
                }
                setProgram(imported);
                setDirty(true);
            } catch (err) {
                alert('Failed to import: ' + (err.message || 'unknown error'));
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // ── Import Excel as new program ──
    const handleImportAsNew = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: 'array' });
                const imported = [];
                for (const sheetName of wb.SheetNames) {
                    const day = DAYS.find(d => d.toLowerCase() === sheetName.toLowerCase());
                    if (!day) continue;
                    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
                    if (rows.length === 0) continue;
                    const firstRow = rows[0];
                    const nameCell = firstRow.Exercise || firstRow.exercise || Object.values(firstRow)[0] || '';
                    const workoutName = nameCell.replace(/^Workout:\s*/i, '').trim() || day;
                    const exercises = [];
                    for (let i = 1; i < rows.length; i++) {
                        const r = rows[i];
                        const exName = r.Exercise || r.exercise || '';
                        if (!exName || exName.toLowerCase().startsWith('workout:')) continue;
                        exercises.push({
                            exerciseId: null,
                            exerciseName: exName,
                            targetMuscles: r.Muscles || r.muscles || '',
                            sets: parseInt(r.Sets || r.sets) || 3,
                            reps: String(r.Reps || r.reps || '10'),
                            weight: String(r.Weight || r.weight || ''),
                            notes: r.Notes || r.notes || ''
                        });
                    }
                    imported.push({ day, name: workoutName, exercises });
                }

                // Use filename (without extension) as program name
                const programTitle = file.name.replace(/\.(xlsx|xls)$/i, '').replace(/_/g, ' ');
                const res = await axios.post('/api/v1/trainer/templates',
                    { name: programTitle, programData: imported },
                    { withCredentials: true }
                );
                setShowNewModal(false);
                await fetchTemplates();
                loadTemplate(res.data.data.id);
            } catch (err) {
                alert('Failed to import: ' + (err.message || 'unknown error'));
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // ── Filtered templates ──
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const dayWorkout = program.find(w => w.day === selectedDay);

    return (
        <div className="tp-container">
            <div className="tp-layout">
                {/* ── Left: Programs list ── */}
                <div className="tp-left">
                    <div className="tp-left-header">
                        <h3 className="tp-left-title">Programs</h3>
                        <button className="tp-new-btn" onClick={() => setShowNewModal(true)} title="Create new program">
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="tp-search-wrap">
                        <Search size={14} className="tp-search-icon" />
                        <input
                            className="tp-search-input"
                            placeholder="Search programs..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="tp-list">
                        {loadingList ? (
                            <div className="tp-list-empty"><Loader2 size={20} className="tp-spin" /></div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="tp-list-empty">
                                {searchQuery ? 'No matching programs.' : 'No programs yet. Create one!'}
                            </div>
                        ) : (
                            filteredTemplates.map(t => (
                                <div
                                    key={t.id}
                                    className={`tp-list-item ${selectedId === t.id ? 'tp-list-item-active' : ''} ${draggingId === t.id ? 'tp-list-item-dragging' : ''}`}
                                    draggable
                                    onDragStart={(e) => {
                                        setDraggingId(t.id);
                                        e.dataTransfer.effectAllowed = 'copy';
                                        e.dataTransfer.setData('text/plain', t.id);
                                    }}
                                    onDragEnd={() => setDraggingId(null)}
                                    onClick={() => loadTemplate(t.id)}
                                >
                                    <div className="tp-list-item-grip">
                                        <GripVertical size={14} />
                                    </div>
                                    <div className="tp-list-item-info">
                                        <span className="tp-list-item-name">{t.name}</span>
                                        <span className="tp-list-item-date">{new Date(t.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="tp-list-item-actions">
                                        <button className="tp-list-item-btn tp-list-item-btn-del" onClick={(e) => handleDelete(t.id, e)} title="Delete">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right: Program editor ── */}
                <div
                    className={`tp-right ${dropHover ? 'tp-right-drop-hover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropHover(true); }}
                    onDragLeave={() => setDropHover(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDropHover(false);
                        const id = parseInt(e.dataTransfer.getData('text/plain'));
                        if (id) loadTemplate(id);
                    }}
                >
                    {!selectedId ? (
                        <div className={`tp-empty-state ${dropHover ? 'tp-empty-state-hover' : ''}`}>
                            <div className="tp-drop-zone">
                                <div className="tp-drop-zone-icon">
                                    <Download size={32} />
                                </div>
                                <p>Drag a program here to edit</p>
                                <span>or click on one from the list</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Program header */}
                            <div className="tp-editor-header">
                                <div className="tp-editor-title-row">
                                    {renaming ? (
                                        <div className="tp-rename-wrap">
                                            <input
                                                className="tp-rename-input"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                                                autoFocus
                                            />
                                            <button className="tp-rename-ok" onClick={handleRename}><Save size={14} /></button>
                                            <button className="tp-rename-cancel" onClick={() => setRenaming(false)}><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="tp-title-group">
                                            <h2 className="tp-editor-title">{programName}</h2>
                                            <button className="tp-rename-trigger" onClick={() => { setRenameValue(programName); setRenaming(true); }} title="Rename">
                                                <Pencil size={13} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="tp-editor-actions">
                                        <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
                                        <button className="tp-action-btn" onClick={() => importRef.current?.click()} title="Import from Excel">
                                            <Upload size={14} /> Import
                                        </button>
                                        <button className="tp-action-btn" onClick={handleExport} title="Export as Excel">
                                            <Download size={14} /> Export
                                        </button>
                                        <button
                                            className="tp-save-btn"
                                            onClick={handleSaveTemplate}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 size={14} className="tp-spin" /> : <Save size={14} />}
                                            Save
                                        </button>
                                    </div>
                                </div>

                                {/* Day tabs */}
                                <div className="tp-day-tabs">
                                    {DAYS.map((day, i) => {
                                        const hasData = program.some(w => w.day === day && (w.name || w.exercises?.length));
                                        return (
                                            <button
                                                key={day}
                                                className={`tp-day-tab ${selectedDay === day ? 'tp-day-tab-active' : ''} ${hasData ? 'tp-day-tab-filled' : ''}`}
                                                onClick={() => {
                                                    // Save current day before switching
                                                    saveDayToProgram();
                                                    setSelectedDay(day);
                                                }}
                                            >
                                                {DAY_ABBR[i]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Day editor */}
                            <div className="tp-editor-body">
                                <div className="tp-day-card">
                                    <div className="tp-day-card-header">
                                        <span className="tp-day-label">{selectedDay}</span>
                                        <input
                                            className="tp-workout-name-input"
                                            placeholder="Workout name (e.g. Upper Body)"
                                            value={editState.name}
                                            onChange={e => { setEditState(prev => ({ ...prev, name: e.target.value })); setDirty(true); }}
                                        />
                                    </div>

                                    {/* Exercises */}
                                    {editState.exercises.length === 0 ? (
                                        <p className="tp-no-exercises">No exercises yet — add one below.</p>
                                    ) : (
                                        <div className="tp-exercise-list">
                                            {editState.exercises.map((ex, idx) => (
                                                <div key={idx} className="tp-exercise-row">
                                                    <div className="tp-exercise-name-col">
                                                        <span className="tp-exercise-idx">{idx + 1}</span>
                                                        <div>
                                                            <div className="tp-exercise-name">{ex.exerciseName}</div>
                                                            {ex.targetMuscles && <div className="tp-exercise-muscles">{ex.targetMuscles}</div>}
                                                        </div>
                                                    </div>
                                                    <div className="tp-exercise-fields">
                                                        <div className="tp-field">
                                                            <label>Sets</label>
                                                            <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 0)} />
                                                        </div>
                                                        <div className="tp-field">
                                                            <label>Reps</label>
                                                            <input value={ex.reps} onChange={e => updateExercise(idx, 'reps', e.target.value)} />
                                                        </div>
                                                        <div className="tp-field">
                                                            <label>Weight</label>
                                                            <input value={ex.weight} onChange={e => updateExercise(idx, 'weight', e.target.value)} placeholder="kg" />
                                                        </div>
                                                    </div>
                                                    <button className="tp-exercise-del" onClick={() => removeExercise(idx)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add exercise */}
                                    <div className="tp-add-exercise" ref={searchRef}>
                                        <div className="tp-ex-input-wrap">
                                            <Plus size={14} className="tp-ex-input-icon" />
                                            <input
                                                className="tp-ex-input"
                                                placeholder="Type exercise name..."
                                                value={exSearch}
                                                onChange={e => setExSearch(e.target.value)}
                                                onFocus={() => setShowExSearch(true)}
                                                onKeyDown={e => { if (e.key === 'Enter' && exSearch.trim()) { addCustomExercise(); } }}
                                            />
                                        </div>
                                        {showExSearch && (
                                            <div className="tp-ex-dropdown">
                                                {exSearch.trim() && filteredEx.length === 0 && (
                                                    <div className="tp-ex-dropdown-item tp-ex-dropdown-custom" onClick={addCustomExercise}>
                                                        <Plus size={13} /> Add "{exSearch.trim()}"
                                                    </div>
                                                )}
                                                {exSearch.trim() && filteredEx.length > 0 && (
                                                    <div className="tp-ex-dropdown-item tp-ex-dropdown-custom" onClick={addCustomExercise}>
                                                        <Plus size={13} /> Add "{exSearch.trim()}" as new
                                                    </div>
                                                )}
                                                {(exSearch.trim() ? filteredEx : allExercises).slice(0, 20).map(ex => (
                                                    <div key={ex.id} className="tp-ex-dropdown-item" onClick={() => addExercise(ex)}>
                                                        <span className="tp-ex-dropdown-name">{ex.name}</span>
                                                        {ex.targetMuscles && <span className="tp-ex-dropdown-muscles">{
                                                            Array.isArray(ex.targetMuscles) ? ex.targetMuscles.join(', ') : ex.targetMuscles
                                                        }</span>}
                                                    </div>
                                                ))}
                                                {allExercises.length === 0 && !exSearch.trim() && (
                                                    <div className="tp-ex-dropdown-empty">Type a name and press Enter to add</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── New program modal ── */}
            {showNewModal && (
                <div className="tp-modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div className="tp-modal" onClick={e => e.stopPropagation()}>
                        <div className="tp-modal-header">
                            <span>New Program</span>
                            <button onClick={() => setShowNewModal(false)}><X size={16} /></button>
                        </div>
                        <p className="tp-modal-hint">Give your new workout program a name.</p>
                        <input
                            className="tp-modal-input"
                            placeholder="e.g. Beginner Strength 4-day"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateNew()}
                            autoFocus
                        />
                        <button className="tp-modal-confirm" onClick={handleCreateNew} disabled={creatingNew || !newName.trim()}>
                            {creatingNew ? <Loader2 size={14} className="tp-spin" /> : <Plus size={14} />} Create
                        </button>

                        <div className="tp-modal-divider">
                            <span>or</span>
                        </div>

                        <input ref={newImportRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportAsNew} />
                        <button className="tp-modal-import-btn" onClick={() => newImportRef.current?.click()}>
                            <Upload size={14} /> Load Program from Excel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerPrograms;
