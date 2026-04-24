import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, Loader2, Search, Dumbbell, X, Plus, Heart, ShieldCheck } from 'lucide-react';
import './CustomerMessages.css';

// ─── Pain Report constants ────────────────────────────────────
const PAIN_ZONE_POS = {
    'Head':           { cx: 60,  cy: 22  }, 'Neck':           { cx: 60,  cy: 43  },
    'Left Shoulder':  { cx: 20,  cy: 54  }, 'Right Shoulder': { cx: 100, cy: 54  },
    'Chest':          { cx: 60,  cy: 70  }, 'Left Arm':       { cx: 19,  cy: 92  },
    'Right Arm':      { cx: 101, cy: 92  }, 'Abdomen':        { cx: 60,  cy: 96  },
    'Lower Back':     { cx: 60,  cy: 118 }, 'Left Hip':       { cx: 37,  cy: 140 },
    'Right Hip':      { cx: 83,  cy: 140 }, 'Left Thigh':     { cx: 41,  cy: 166 },
    'Right Thigh':    { cx: 79,  cy: 166 }, 'Left Knee':      { cx: 41,  cy: 192 },
    'Right Knee':     { cx: 79,  cy: 192 }, 'Left Calf':      { cx: 41,  cy: 215 },
    'Right Calf':     { cx: 79,  cy: 215 }, 'Left Foot':      { cx: 41,  cy: 238 },
    'Right Foot':     { cx: 79,  cy: 238 },
};
const SEV_COLOR = { Mild: '#facc15', Moderate: '#f97316', High: '#f87171' };

const PainBodySVG = ({ selectedZone, onSelectZone }) => (
    <svg viewBox="0 0 120 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <circle cx="60" cy="22" r="16" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        <rect x="54" y="37" width="12" height="12" rx="3" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1"/>
        <rect x="28" y="46" width="64" height="88" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        <rect x="11" y="48" width="17" height="78" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        <rect x="92" y="48" width="17" height="78" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        <rect x="29" y="132" width="24" height="116" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        <rect x="67" y="132" width="24" height="116" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
        {Object.entries(PAIN_ZONE_POS).map(([zone, pos]) => {
            const isSel = selectedZone === zone;
            return (
                <g key={zone} style={{ cursor: 'pointer' }} onClick={() => onSelectZone(zone)}>
                    <circle cx={pos.cx} cy={pos.cy} r="11" fill="transparent"/>
                    {isSel && <circle cx={pos.cx} cy={pos.cy} r="9" fill="#a5b4fc" opacity="0.2"/>}
                    <circle cx={pos.cx} cy={pos.cy} r={isSel ? 6 : 4}
                        fill={isSel ? '#a5b4fc' : 'rgba(255,255,255,0.15)'}
                        stroke={isSel ? '#818cf8' : 'rgba(255,255,255,0.25)'}
                        strokeWidth="1"
                    />
                </g>
            );
        })}
    </svg>
);

const CustomerMessages = ({ user, targetTrainer }) => {
    const [convos, setConvos]         = useState([]);
    const [active, setActive]         = useState(null); // { id, name }
    const [messages, setMessages]     = useState([]);
    const [text, setText]             = useState('');
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs]    = useState(false);
    const [sending, setSending]       = useState(false);
    const [search, setSearch]             = useState('');
    const [expandedWorkouts, setExpandedWorkouts]   = useState(new Set());
    const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
    const [pickerTemplates, setPickerTemplates]     = useState([]);
    const [loadingPicker, setLoadingPicker]         = useState(false);
    const [showPlusMenu, setShowPlusMenu]           = useState(false);
    const [showPainModal, setShowPainModal]         = useState(false);
    const [painForm, setPainForm]                   = useState({ zone: null, severity: 'Mild', note: '' });
    const [submittingPain, setSubmittingPain]       = useState(false);
    const [showMyPainModal, setShowMyPainModal]     = useState(false);
    const [myPainEntries, setMyPainEntries]         = useState([]);
    const [loadingMyPain, setLoadingMyPain]         = useState(false);
    const bottomRef                   = useRef(null);
    const pollRef                     = useRef(null);
    const inputRef                    = useRef(null);
    const plusMenuRef                 = useRef(null);

    // ── Fetch conversation list ──────────────────────────────────
    const fetchConvos = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/chat/conversations', { withCredentials: true });
            setConvos(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    // ── Fetch messages for active partner ───────────────────────
    const fetchMessages = useCallback(async (partnerId) => {
        try {
            const res = await axios.get(`/api/v1/chat?partnerId=${partnerId}`, { withCredentials: true });
            setMessages(res.data.data || []);
            axios.post('/api/v1/chat/mark-read', { partnerId }, { withCredentials: true }).catch(() => {});
            // clear unread badge locally
            setConvos(prev => prev.map(c => c.id === partnerId ? { ...c, unread: 0 } : c));
        } catch { /* silent */ }
    }, []);

    // ── Init: load convos, handle targetTrainer ──────────────────
    useEffect(() => {
        const init = async () => {
            setLoadingConvos(true);
            await fetchConvos();
            setLoadingConvos(false);
        };
        init();
    }, [fetchConvos]);

    // ── When targetTrainer changes (from Find a Trainer) ─────────
    useEffect(() => {
        if (!targetTrainer?.id) return;
        setActive({ id: targetTrainer.id, name: targetTrainer.name });
        // ensure it appears in sidebar even if no prior messages
        setConvos(prev => {
            if (prev.find(c => c.id === targetTrainer.id)) return prev;
            return [{ id: targetTrainer.id, name: targetTrainer.name, lastMessage: '', lastAt: null, unread: 0 }, ...prev];
        });
    }, [targetTrainer]);

    // ── When active conversation changes, load messages ──────────
    useEffect(() => {
        if (!active?.id) return;
        setLoadingMsgs(true);
        setMessages([]);
        fetchMessages(active.id).finally(() => setLoadingMsgs(false));

        clearInterval(pollRef.current);
        pollRef.current = setInterval(() => {
            fetchMessages(active.id);
            fetchConvos();
        }, 4000);
        return () => clearInterval(pollRef.current);
    }, [active?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!showPlusMenu) return;
        const handler = (e) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) {
                setShowPlusMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPlusMenu]);

    const handleSelect = (convo) => {
        setActive({ id: convo.id, name: convo.name });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending || !active) return;
        setSending(true);
        try {
            await axios.post('/api/v1/chat', { content: text.trim(), receiverId: active.id }, { withCredentials: true });
            setText('');
            await fetchMessages(active.id);
            await fetchConvos();
            inputRef.current?.focus();
        } catch { /* silent */ } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d    = new Date(dateStr);
        const diff = Date.now() - d;
        const mins = Math.floor(diff / 60000);
        if (mins < 1)  return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)  return `${hrs}h`;
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatFullTime = (dateStr) => {
        if (!dateStr) return '';
        const d    = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSep = (dateStr) => {
        if (!dateStr) return '';
        const d         = new Date(dateStr);
        const today     = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const isToday     = d.toDateString() === today.toDateString();
        const isYesterday = d.toDateString() === yesterday.toDateString();
        const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${label} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const openWorkoutPicker = async () => {
        setShowWorkoutPicker(true);
        setLoadingPicker(true);
        try {
            const res = await axios.get('/api/v1/trainer/templates?type=day', { withCredentials: true });
            setPickerTemplates(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingPicker(false); }
    };

    const sendWorkout = async (tpl) => {
        try {
            let exs = tpl.programData?.exercises;
            if (!exs) {
                const res = await axios.get(`/api/v1/trainer/templates/${tpl.id}`, { withCredentials: true });
                exs = res.data.data?.programData?.exercises || [];
            }
            const content = `__WORKOUT__${JSON.stringify({ name: tpl.name, exercises: exs })}`;
            await axios.post('/api/v1/chat', { content, receiverId: active.id }, { withCredentials: true });
            await fetchMessages(active.id);
            await fetchConvos();
        } catch (e) { console.error(e); }
        setShowWorkoutPicker(false);
    };

    const toggleWorkout = (id) => setExpandedWorkouts(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
    });

    const openMyPain = async () => {
        setShowPlusMenu(false);
        setShowMyPainModal(true);
        setLoadingMyPain(true);
        try {
            const res = await axios.get('/api/v1/users/pain', { withCredentials: true });
            setMyPainEntries(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoadingMyPain(false); }
    };

    const handleDeleteMyPain = async (id) => {
        try {
            await axios.delete(`/api/v1/users/pain/${id}`, { withCredentials: true });
            setMyPainEntries(prev => prev.filter(e => e.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleSubmitPain = async () => {
        if (!painForm.zone) return;
        setSubmittingPain(true);
        try {
            await axios.post('/api/v1/users/report-pain', {
                zone: painForm.zone,
                severity: painForm.severity,
                note: painForm.note,
            }, { withCredentials: true });
            setShowPainModal(false);
            setPainForm({ zone: null, severity: 'Mild', note: '' });
        } catch (e) { console.error(e); }
        finally { setSubmittingPain(false); }
    };

    const isRecentlyActive = (lastAt) => lastAt && Date.now() - new Date(lastAt) < 15 * 60 * 1000;
    const parseWorkout = (content) => {
        if (!content?.startsWith('__WORKOUT__')) return null;
        try { return JSON.parse(content.slice(11)); } catch { return null; }
    };
    const filteredConvos = convos.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

    const myId = user?.id;

    return (
        <div className="cm-wrap">
            {/* ── Sidebar ── */}
            <div className="cm-sidebar">
                <div className="cm-sidebar-title">Messages</div>
                <div className="cm-sidebar-search">
                    <Search size={13} className="cm-sidebar-search-icon" />
                    <input
                        className="cm-sidebar-search-input"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {loadingConvos ? (
                    <div className="cm-sidebar-empty"><Loader2 className="cm-spin" size={20} /></div>
                ) : filteredConvos.length === 0 ? (
                    <div className="cm-sidebar-empty">{search ? 'No results.' : 'No conversations yet.'}</div>
                ) : (
                    filteredConvos.map(c => (
                        <button
                            key={c.id}
                            className={`cm-convo-item ${active?.id === c.id ? 'active' : ''}`}
                            onClick={() => handleSelect(c)}
                        >
                            <div className="cm-convo-avatar-wrap">
                                <div className="cm-convo-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                                <div className={`cm-convo-status-dot ${isRecentlyActive(c.lastAt) ? 'online' : 'offline'}`} />
                            </div>
                            <div className="cm-convo-info">
                                <div className="cm-convo-row">
                                    <span className="cm-convo-name">{c.name}</span>
                                    <span className="cm-convo-time">{formatTime(c.lastAt)}</span>
                                </div>
                                <div className="cm-convo-row">
                                    <span className="cm-convo-preview">{c.lastMessage?.slice(0, 35) || 'Start a conversation'}{c.lastMessage?.length > 35 ? '…' : ''}</span>
                                    {c.unread > 0 && <span className="cm-convo-badge">{c.unread}</span>}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* ── Chat panel ── */}
            <div className="cm-container">
                {!active ? (
                    <div className="cm-state" style={{ height: '100%' }}>
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="cm-header">
                            <div className="cm-header-avatar">{active.name?.charAt(0).toUpperCase()}</div>
                            <div className="cm-header-info">
                                <h2>{active.name}</h2>
                                <span>Personal Trainer</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="cm-messages">
                            {loadingMsgs ? (
                                <div className="cm-state">
                                    <Loader2 className="cm-spin" size={24} />
                                    <p>Loading…</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="cm-state">
                                    <p>No messages yet — say hello!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.senderId === myId;
                                    const prev = messages[i - 1];
                                    const showSep = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                                    const isFirstOfCluster = !prev || prev.senderId !== msg.senderId;
                                    const workout = parseWorkout(msg.content);
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showSep && (
                                                <div className="cm-date-sep">
                                                    <span>{formatDateSep(msg.createdAt)}</span>
                                                </div>
                                            )}
                                            <div className={`cm-msg-row ${isMe ? 'me' : 'them'}`}>
                                                {!isMe && (
                                                    isFirstOfCluster
                                                        ? <div className="cm-avatar">{(msg.Sender?.name || active.name || 'T').charAt(0).toUpperCase()}</div>
                                                        : <div className="cm-avatar-spacer" />
                                                )}
                                                {workout ? (
                                                    <div className={`cm-bubble cm-workout-card ${isMe ? 'me' : 'them'}`}>
                                                        <div className="cm-workout-title">{workout.name}</div>
                                                        {(expandedWorkouts.has(msg.id) ? workout.exercises : workout.exercises.slice(0, 4)).map((ex, j) => (
                                                            <div key={j} className="cm-workout-ex">
                                                                {ex.exerciseName}{ex.sets ? ` · ${ex.sets}×${ex.reps || '?'}` : ''}
                                                            </div>
                                                        ))}
                                                        {workout.exercises.length > 4 && (
                                                            <button className="cm-workout-more" onClick={() => toggleWorkout(msg.id)}>
                                                                {expandedWorkouts.has(msg.id) ? 'Show less' : `+${workout.exercises.length - 4} more`}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`cm-bubble ${isMe ? 'me' : 'them'}`}>
                                                        <p>{msg.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Workout picker */}
                        {showWorkoutPicker && (
                            <div className="cm-workout-picker">
                                <div className="cm-workout-picker-header">
                                    <span>Send Workout</span>
                                    <button onClick={() => setShowWorkoutPicker(false)}><X size={14} /></button>
                                </div>
                                {loadingPicker ? (
                                    <div className="cm-workout-picker-empty"><Loader2 className="cm-spin" size={16} /></div>
                                ) : pickerTemplates.length === 0 ? (
                                    <div className="cm-workout-picker-empty">No day programs saved yet.</div>
                                ) : (
                                    pickerTemplates.map(tpl => (
                                        <button key={tpl.id} className="cm-workout-picker-item" onClick={() => sendWorkout(tpl)}>
                                            <span>{tpl.name}</span>
                                            <span className="cm-workout-picker-count">{(tpl.programData?.exercises || []).length} ex</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Input */}
                        <form className="cm-input-row" onSubmit={handleSend}>
                            <div className="cm-plus-wrap" ref={plusMenuRef}>
                                <button
                                    type="button"
                                    className={`cm-plus-btn ${showPlusMenu ? 'open' : ''}`}
                                    onClick={() => setShowPlusMenu(v => !v)}
                                >
                                    <Plus size={16} />
                                </button>
                                {showPlusMenu && (
                                    <div className="cm-plus-menu">
                                        <button className="cm-plus-item" onClick={() => { setShowPlusMenu(false); setShowPainModal(true); }}>
                                            <Heart size={14} className="cm-plus-item-icon pain" />
                                            Report pain
                                        </button>
                                        <button className="cm-plus-item" onClick={openMyPain}>
                                            <ShieldCheck size={14} className="cm-plus-item-icon free" />
                                            My pain zones
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={inputRef}
                                className="cm-input"
                                placeholder={`Message ${active.name}…`}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                disabled={sending}
                            />
                            <button className="cm-send" type="submit" disabled={sending || !text.trim()}>
                                {sending ? <Loader2 className="cm-spin" size={16} /> : <Send size={16} />}
                            </button>
                        </form>

                        {/* My Pain Zones modal */}
                        {showMyPainModal && (
                            <div className="cm-pain-overlay" onClick={() => setShowMyPainModal(false)}>
                                <div className="cm-pain-modal cm-mypain-modal" onClick={e => e.stopPropagation()}>
                                    <button className="cm-pain-close" onClick={() => setShowMyPainModal(false)}><X size={15} /></button>
                                    <div className="cm-pain-top">
                                        <span className="cm-pain-label">PAIN ZONES</span>
                                        <h2 className="cm-pain-title">My active pain zones</h2>
                                        <p className="cm-pain-sub">Remove zones that are no longer bothering you</p>
                                    </div>
                                    <div className="cm-mypain-list">
                                        {loadingMyPain ? (
                                            <div className="cm-mypain-empty"><Loader2 className="cm-spin" size={20} /></div>
                                        ) : myPainEntries.length === 0 ? (
                                            <div className="cm-mypain-empty">
                                                <ShieldCheck size={28} style={{ color: '#4ade80', marginBottom: 8 }} />
                                                <span>No active pain zones — you're good!</span>
                                            </div>
                                        ) : myPainEntries.map(e => (
                                            <div key={e.id} className="cm-mypain-row">
                                                <span className="cm-mypain-dot" style={{ background: SEV_COLOR[e.severity === 'Low' ? 'Mild' : e.severity] || SEV_COLOR.Mild }} />
                                                <div className="cm-mypain-info">
                                                    <span className="cm-mypain-zone">{e.zone}</span>
                                                    <span className="cm-mypain-sev" style={{ color: SEV_COLOR[e.severity === 'Low' ? 'Mild' : e.severity] || SEV_COLOR.Mild }}>
                                                        {e.severity === 'Low' ? 'Mild' : e.severity}
                                                    </span>
                                                    {e.note && <span className="cm-mypain-note">{e.note}</span>}
                                                </div>
                                                <button className="cm-mypain-del" onClick={() => handleDeleteMyPain(e.id)} title="Mark as pain free">
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="cm-pain-footer">
                                        <button type="button" className="cm-pain-cancel" onClick={() => setShowMyPainModal(false)}>Close</button>
                                        {myPainEntries.length > 0 && (
                                            <button
                                                type="button"
                                                className="cm-pain-submit"
                                                style={{ background: '#22c55e' }}
                                                onClick={async () => {
                                                    for (const e of myPainEntries) await handleDeleteMyPain(e.id);
                                                    setShowMyPainModal(false);
                                                }}
                                            >
                                                I'm completely pain free
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pain report modal */}
                        {showPainModal && (
                            <div className="cm-pain-overlay" onClick={() => setShowPainModal(false)}>
                                <div className="cm-pain-modal" onClick={e => e.stopPropagation()}>
                                    <button className="cm-pain-close" onClick={() => setShowPainModal(false)}><X size={15} /></button>
                                    <div className="cm-pain-top">
                                        <span className="cm-pain-label">REPORT PAIN</span>
                                        <h2 className="cm-pain-title">Where does it hurt?</h2>
                                        <p className="cm-pain-sub">Tap zones · your trainer will be notified</p>
                                    </div>
                                    <div className="cm-pain-body">
                                        <div className="cm-pain-svg-col">
                                            <PainBodySVG
                                                selectedZone={painForm.zone}
                                                onSelectZone={z => setPainForm(p => ({ ...p, zone: z }))}
                                            />
                                        </div>
                                        <div className="cm-pain-controls">
                                            <div className="cm-pain-section">
                                                <span className="cm-pain-section-label">SEVERITY</span>
                                                <div className="cm-pain-sev-row">
                                                    {['Mild', 'Moderate', 'High'].map(s => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            className={`cm-pain-sev-btn ${painForm.severity === s ? 'active' : ''}`}
                                                            style={painForm.severity === s ? { borderColor: SEV_COLOR[s], color: SEV_COLOR[s], background: `${SEV_COLOR[s]}22` } : {}}
                                                            onClick={() => setPainForm(p => ({ ...p, severity: s }))}
                                                        >{s}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="cm-pain-section">
                                                <span className="cm-pain-section-label">SELECTED</span>
                                                <span className={`cm-pain-selected-zone ${!painForm.zone ? 'placeholder' : ''}`}>
                                                    {painForm.zone || 'Tap a zone on the body'}
                                                </span>
                                            </div>
                                            <textarea
                                                className="cm-pain-note"
                                                placeholder="Add a note (optional)…"
                                                value={painForm.note}
                                                onChange={e => setPainForm(p => ({ ...p, note: e.target.value }))}
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                    <div className="cm-pain-footer">
                                        <button type="button" className="cm-pain-cancel" onClick={() => setShowPainModal(false)}>Cancel</button>
                                        <button
                                            type="button"
                                            className="cm-pain-submit"
                                            disabled={!painForm.zone || submittingPain}
                                            onClick={handleSubmitPain}
                                        >
                                            {submittingPain ? <Loader2 className="cm-spin" size={14} /> : 'Notify Trainer →'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerMessages;
