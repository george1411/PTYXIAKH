import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, Loader2, Search, X, Plus, Heart, Users } from 'lucide-react';
import './CustomerMessages.css';

// ─── Pain Report constants ────────────────────────────────────
const PAIN_ZONES = [
    { id: 'neck',           label: 'Neck',           x: 150, y: 58  },
    { id: 'left-shoulder',  label: 'Left Shoulder',  x: 108, y: 100 },
    { id: 'right-shoulder', label: 'Right Shoulder', x: 192, y: 100 },
    { id: 'chest',          label: 'Chest',          x: 150, y: 135 },
    { id: 'left-elbow',     label: 'Left Elbow',     x: 80,  y: 175 },
    { id: 'right-elbow',    label: 'Right Elbow',    x: 220, y: 175 },
    { id: 'lower-back',     label: 'Lower Back',     x: 150, y: 210 },
    { id: 'left-hip',       label: 'Left Hip',       x: 118, y: 248 },
    { id: 'right-hip',      label: 'Right Hip',      x: 182, y: 248 },
    { id: 'left-knee',      label: 'Left Knee',      x: 112, y: 330 },
    { id: 'right-knee',     label: 'Right Knee',     x: 188, y: 330 },
    { id: 'left-ankle',     label: 'Left Ankle',     x: 108, y: 430 },
    { id: 'right-ankle',    label: 'Right Ankle',    x: 192, y: 430 },
];

const SEV_META = {
    Low:      { color: '#facc15', bg: 'rgba(250,204,21,0.18)',   border: 'rgba(250,204,21,0.5)'   },
    Moderate: { color: '#f97316', bg: 'rgba(249,115,22,0.18)',   border: 'rgba(249,115,22,0.5)'   },
    High:     { color: '#f87171', bg: 'rgba(248,113,113,0.18)',  border: 'rgba(248,113,113,0.5)'  },
};

const PainBodySVG = ({ selectedZones, onToggleZone, hoveredZone, onHoverZone }) => {
    const getColor = (id) => {
        const z = selectedZones.find(z => z.id === id);
        return z ? SEV_META[z.sev]?.color : null;
    };
    return (
        <svg viewBox="0 0 300 480" width="110" height="176" style={{ display: 'block' }}>
            <ellipse cx="150" cy="44" rx="28" ry="34" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <rect x="138" y="75" width="24" height="18" rx="6" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M105 92 Q90 100 85 160 Q83 200 88 240 L212 240 Q217 200 215 160 Q210 100 195 92 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M105 95 Q78 110 72 145 Q68 175 74 210 Q80 230 90 230 Q95 205 95 175 Q96 140 108 115 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M195 95 Q222 110 228 145 Q232 175 226 210 Q220 230 210 230 Q205 205 205 175 Q204 140 192 115 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M74 210 Q68 240 70 265 Q72 280 80 282 Q88 284 92 270 Q94 255 90 230 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M226 210 Q232 240 230 265 Q228 280 220 282 Q212 284 208 270 Q206 255 210 230 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M112 240 Q102 270 100 310 Q98 350 102 390 Q106 415 116 416 Q126 417 128 390 Q130 355 130 310 Q130 275 138 240 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M188 240 Q198 270 200 310 Q202 350 198 390 Q194 415 184 416 Q174 417 172 390 Q170 355 170 310 Q170 275 162 240 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M102 390 Q100 420 102 448 Q104 462 114 463 Q122 464 124 448 Q126 425 128 390 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <path d="M198 390 Q200 420 198 448 Q196 462 186 463 Q178 464 176 448 Q174 425 172 390 Z" fill="#1e1e1e" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            {PAIN_ZONES.map(z => {
                const color = getColor(z.id);
                const isHov = hoveredZone === z.id;
                return (
                    <g key={z.id} style={{ cursor: 'pointer' }}
                        onClick={() => onToggleZone(z)}
                        onMouseEnter={() => onHoverZone(z.id)}
                        onMouseLeave={() => onHoverZone(null)}>
                        <circle cx={z.x} cy={z.y} r={14} fill="transparent"/>
                        {color && <>
                            <circle cx={z.x} cy={z.y} r={11} fill={color} opacity="0.15"/>
                            <circle cx={z.x} cy={z.y} r={11} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5"/>
                        </>}
                        <circle cx={z.x} cy={z.y} r={isHov ? 7 : 5}
                            fill={color || (isHov ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)')}
                            stroke={color || 'rgba(255,255,255,0.2)'} strokeWidth="1"/>
                    </g>
                );
            })}
        </svg>
    );
};

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
    const [groups, setGroups]                       = useState([]);
    const [activeGroup, setActiveGroup]             = useState(null); // { id, name }
    const [groupMessages, setGroupMessages]         = useState([]);
    const [loadingGroup, setLoadingGroup]           = useState(false);
    const [groupText, setGroupText]                 = useState('');
    const [sendingGroup, setSendingGroup]           = useState(false);
    const groupPollRef                              = useRef(null);
    const groupBottomRef                            = useRef(null);
    const groupInputRef                             = useRef(null);
    const [showPlusMenu, setShowPlusMenu]           = useState(false);
    const [showPainModal, setShowPainModal]         = useState(false);
    const [painZones, setPainZones]                 = useState([]);
    const [painActiveSev, setPainActiveSev]         = useState('Low');
    const [painNote, setPainNote]                   = useState('');
    const [painSent, setPainSent]                   = useState(false);
    const [painHovered, setPainHovered]             = useState(null);
    const [submittingPain, setSubmittingPain]       = useState(false);
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

    // ── Fetch groups ─────────────────────────────────────────────
    const fetchGroups = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/groups', { withCredentials: true });
            setGroups(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    // ── Fetch group messages ─────────────────────────────────────
    const fetchGroupMessages = useCallback(async (groupId) => {
        try {
            const res = await axios.get(`/api/v1/groups/${groupId}/messages`, { withCredentials: true });
            setGroupMessages(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    // ── Init: load convos + groups ───────────────────────────────
    useEffect(() => {
        const init = async () => {
            setLoadingConvos(true);
            await Promise.all([fetchConvos(), fetchGroups()]);
            setLoadingConvos(false);
        };
        init();
    }, [fetchConvos, fetchGroups]);

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

    // ── When active group changes, load its messages ─────────────
    useEffect(() => {
        if (!activeGroup?.id) return;
        setLoadingGroup(true);
        setGroupMessages([]);
        fetchGroupMessages(activeGroup.id).finally(() => setLoadingGroup(false));
        clearInterval(groupPollRef.current);
        groupPollRef.current = setInterval(() => fetchGroupMessages(activeGroup.id), 4000);
        return () => clearInterval(groupPollRef.current);
    }, [activeGroup?.id, fetchGroupMessages]);

    useEffect(() => {
        groupBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [groupMessages]);

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
        setActiveGroup(null);
        setActive({ id: convo.id, name: convo.name });
    };

    const handleSelectGroup = (g) => {
        setActive(null);
        setActiveGroup({ id: g.id, name: g.name });
    };

    const handleSendGroup = async (e) => {
        e.preventDefault();
        if (!groupText.trim() || sendingGroup || !activeGroup) return;
        setSendingGroup(true);
        try {
            await axios.post(`/api/v1/groups/${activeGroup.id}/messages`, { content: groupText.trim() }, { withCredentials: true });
            setGroupText('');
            await fetchGroupMessages(activeGroup.id);
            groupInputRef.current?.focus();
        } catch { /* silent */ } finally { setSendingGroup(false); }
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

    const closePainModal = () => {
        setShowPainModal(false);
        setPainZones([]);
        setPainActiveSev('Low');
        setPainNote('');
        setPainSent(false);
        setPainHovered(null);
    };

    const togglePainZone = (zone) => {
        setPainZones(prev => {
            const exists = prev.find(z => z.id === zone.id);
            if (exists) return prev.filter(z => z.id !== zone.id);
            return [...prev, { ...zone, sev: painActiveSev }];
        });
    };

    const handleSubmitPain = async () => {
        if (painZones.length === 0) return;
        setSubmittingPain(true);
        try {
            for (const z of painZones) {
                await axios.post('/api/v1/users/report-pain', {
                    zone: z.label,
                    severity: z.sev,
                    note: painNote,
                }, { withCredentials: true });
            }
            setPainSent(true);
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
                ) : (
                    <>
                        {filteredConvos.length > 0 && (
                            <>
                                <div className="cm-sidebar-section-label">Direct</div>
                                {filteredConvos.map(c => (
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
                                ))}
                            </>
                        )}
                        {groups.length > 0 && (
                            <>
                                <div className="cm-sidebar-section-label">Groups</div>
                                {groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase())).map(g => (
                                    <button
                                        key={`g-${g.id}`}
                                        className={`cm-convo-item ${activeGroup?.id === g.id ? 'active' : ''}`}
                                        onClick={() => handleSelectGroup(g)}
                                    >
                                        <div className="cm-convo-avatar-wrap">
                                            <div className="cm-convo-avatar cm-group-avatar"><Users size={13} /></div>
                                        </div>
                                        <div className="cm-convo-info">
                                            <div className="cm-convo-row">
                                                <span className="cm-convo-name">{g.name}</span>
                                            </div>
                                            <div className="cm-convo-row">
                                                <span className="cm-convo-preview">{g.memberCount} member{g.memberCount !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                        {filteredConvos.length === 0 && groups.length === 0 && (
                            <div className="cm-sidebar-empty">{search ? 'No results.' : 'No conversations yet.'}</div>
                        )}
                    </>
                )}
            </div>

            {/* ── Chat panel ── */}
            <div className="cm-container">
                {/* ── Group chat panel ── */}
                {activeGroup ? (
                    <>
                        <div className="cm-header">
                            <div className="cm-header-avatar cm-group-avatar"><Users size={16} /></div>
                            <div className="cm-header-info">
                                <h2>{activeGroup.name}</h2>
                                <span>Group</span>
                            </div>
                        </div>
                        <div className="cm-messages">
                            {loadingGroup ? (
                                <div className="cm-state"><Loader2 className="cm-spin" size={24} /><p>Loading…</p></div>
                            ) : groupMessages.length === 0 ? (
                                <div className="cm-state"><p>No messages yet — say hello!</p></div>
                            ) : (
                                groupMessages.map((msg, i) => {
                                    const isMe = msg.senderId === myId;
                                    const prev = groupMessages[i - 1];
                                    const showSep = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                                    const showName = !isMe && (!prev || prev.senderId !== msg.senderId || showSep);
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showSep && <div className="cm-date-sep"><span>{formatDateSep(msg.createdAt)}</span></div>}
                                            <div className={`cm-msg-row ${isMe ? 'me' : 'them'}`}>
                                                {!isMe && <div className="cm-avatar">{(msg.senderName || '?').charAt(0).toUpperCase()}</div>}
                                                <div className="cm-bubble-wrap">
                                                    {showName && <span className="cm-sender-name">{msg.senderName}</span>}
                                                    <div className={`cm-bubble ${isMe ? 'me' : 'them'}`}><p>{msg.content}</p></div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={groupBottomRef} />
                        </div>
                        <form className="cm-input-row" onSubmit={handleSendGroup}>
                            <input
                                ref={groupInputRef}
                                className="cm-input"
                                placeholder={`Message ${activeGroup.name}…`}
                                value={groupText}
                                onChange={e => setGroupText(e.target.value)}
                                disabled={sendingGroup}
                            />
                            <button className="cm-send" type="submit" disabled={sendingGroup || !groupText.trim()}>
                                {sendingGroup ? <Loader2 className="cm-spin" size={16} /> : <Send size={16} />}
                            </button>
                        </form>
                    </>
                ) : !active ? (
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

                        {/* Pain report modal */}
                        {showPainModal && (
                            <div className="cm-pain-overlay" onClick={closePainModal}>
                                <div className="cm-pain-modal" onClick={e => e.stopPropagation()}>
                                    {painSent ? (
                                        /* ── Success screen ── */
                                        <div className="cm-pain-sent">
                                            <div className="cm-pain-sent-icon">
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            </div>
                                            <div className="cm-pain-sent-title">Trainer notified</div>
                                            <div className="cm-pain-sent-sub">
                                                Reported {painZones.length} zone{painZones.length > 1 ? 's' : ''}: {painZones.map(z => z.label).join(', ')}.
                                            </div>
                                            <button className="cm-pain-sent-done" onClick={closePainModal}>Done</button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Header */}
                                            <div className="cm-pain-top">
                                                <div>
                                                    <span className="cm-pain-label">REPORT PAIN</span>
                                                    <h2 className="cm-pain-title">Where does it hurt?</h2>
                                                    <p className="cm-pain-sub">Tap zones · your trainer will be notified</p>
                                                </div>
                                                <button className="cm-pain-close" onClick={closePainModal}><X size={14} /></button>
                                            </div>

                                            {/* Severity strip */}
                                            <div className="cm-pain-sev-strip">
                                                {Object.entries(SEV_META).map(([sev, meta]) => (
                                                    <button
                                                        key={sev}
                                                        type="button"
                                                        className="cm-pain-sev-btn"
                                                        style={painActiveSev === sev
                                                            ? { borderColor: meta.border, color: meta.color, background: meta.bg }
                                                            : {}}
                                                        onClick={() => setPainActiveSev(sev)}
                                                    >{sev}</button>
                                                ))}
                                            </div>

                                            {/* Body map + selected list */}
                                            <div className="cm-pain-body">
                                                <div className="cm-pain-svg-col">
                                                    <PainBodySVG
                                                        selectedZones={painZones}
                                                        onToggleZone={togglePainZone}
                                                        hoveredZone={painHovered}
                                                        onHoverZone={setPainHovered}
                                                    />
                                                </div>
                                                <div className="cm-pain-right">
                                                    <span className="cm-pain-section-label">SELECTED</span>
                                                    {painZones.length === 0 ? (
                                                        <div className="cm-pain-selected-zone placeholder">Tap a zone on the body</div>
                                                    ) : (
                                                        <div className="cm-pain-zone-list">
                                                            {painZones.map(z => {
                                                                const meta = SEV_META[z.sev];
                                                                return (
                                                                    <div
                                                                        key={z.id}
                                                                        className="cm-pain-zone-row"
                                                                        onMouseEnter={() => setPainHovered(z.id)}
                                                                        onMouseLeave={() => setPainHovered(null)}
                                                                        style={{ background: painHovered === z.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)' }}
                                                                    >
                                                                        <span className="cm-pain-zone-dot" style={{ background: meta.color }} />
                                                                        <span className="cm-pain-zone-name">{z.label}</span>
                                                                        <span className="cm-pain-zone-sev" style={{ color: meta.color }}>{z.sev}</span>
                                                                        <button
                                                                            type="button"
                                                                            className="cm-pain-zone-del"
                                                                            onClick={() => setPainZones(p => p.filter(x => x.id !== z.id))}
                                                                        >×</button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    <textarea
                                                        className="cm-pain-note"
                                                        placeholder="Add a note (optional)…"
                                                        value={painNote}
                                                        onChange={e => setPainNote(e.target.value)}
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="cm-pain-footer">
                                                <button type="button" className="cm-pain-cancel" onClick={closePainModal}>Cancel</button>
                                                <button
                                                    type="button"
                                                    className={`cm-pain-submit ${painZones.length > 0 ? 'active' : ''}`}
                                                    disabled={painZones.length === 0 || submittingPain}
                                                    onClick={handleSubmitPain}
                                                >
                                                    {submittingPain ? <Loader2 className="cm-spin" size={14} /> : 'Notify Trainer →'}
                                                </button>
                                            </div>
                                        </>
                                    )}
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
