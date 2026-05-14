import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, Loader2, Search, X, Plus, Heart, Users, ArrowLeft } from 'lucide-react';
import './CustomerMessages.css';
import useIsMobile from '../../../../hooks/useIsMobile';

// ─── Pain Report constants ────────────────────────────────────
const SEV_META = {
    Low:      { color: '#facc15', bg: 'rgba(250,204,21,0.18)',   border: 'rgba(250,204,21,0.5)'   },
    Moderate: { color: '#f97316', bg: 'rgba(249,115,22,0.18)',   border: 'rgba(249,115,22,0.5)'   },
    High:     { color: '#f87171', bg: 'rgba(248,113,113,0.18)',  border: 'rgba(248,113,113,0.5)'  },
};

const ZONE_DOT_POS = {
    'Head':           { cx: 60,  cy: 22  },
    'Neck':           { cx: 60,  cy: 43  },
    'Left Shoulder':  { cx: 20,  cy: 54  },
    'Right Shoulder': { cx: 100, cy: 54  },
    'Chest':          { cx: 60,  cy: 70  },
    'Left Arm':       { cx: 19,  cy: 92  },
    'Right Arm':      { cx: 101, cy: 92  },
    'Abdomen':        { cx: 60,  cy: 96  },
    'Lower Back':     { cx: 60,  cy: 118 },
    'Left Hip':       { cx: 37,  cy: 140 },
    'Right Hip':      { cx: 83,  cy: 140 },
    'Left Thigh':     { cx: 41,  cy: 166 },
    'Right Thigh':    { cx: 79,  cy: 166 },
    'Left Knee':      { cx: 41,  cy: 192 },
    'Right Knee':     { cx: 79,  cy: 192 },
    'Left Calf':      { cx: 41,  cy: 215 },
    'Right Calf':     { cx: 79,  cy: 215 },
    'Left Foot':      { cx: 41,  cy: 238 },
    'Right Foot':     { cx: 79,  cy: 238 },
};

const PainBodySVG = ({ selectedZones, onToggleZone, hoveredZone, onHoverZone }) => {
    const zoneMap = {};
    selectedZones.forEach(z => { zoneMap[z.zone] = z; });
    return (
        <svg viewBox="0 0 120 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 260, display: 'block' }}>
            <circle cx="60" cy="22" r="16" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            <rect x="54" y="37" width="12" height="12" rx="3" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1"/>
            <rect x="28" y="46" width="64" height="88" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            <rect x="11" y="48" width="17" height="78" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            <rect x="92" y="48" width="17" height="78" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            <rect x="29" y="132" width="24" height="116" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            <rect x="67" y="132" width="24" height="116" rx="8" fill="#1a1a2e" stroke="#2e2e44" strokeWidth="1.5"/>
            {Object.entries(ZONE_DOT_POS).map(([zone, pos]) => {
                const selected = zoneMap[zone];
                const color = selected ? SEV_META[selected.sev]?.color : null;
                const isHov = hoveredZone === zone;
                return (
                    <g key={zone} style={{ cursor: 'pointer' }}
                        onClick={() => onToggleZone(zone)}
                        onMouseEnter={() => onHoverZone(zone)}
                        onMouseLeave={() => onHoverZone(null)}>
                        <circle cx={pos.cx} cy={pos.cy} r="10" fill="transparent"/>
                        {(selected || isHov) && (
                            <circle cx={pos.cx} cy={pos.cy} r="9" fill={color || 'rgba(255,255,255,0.08)'} opacity={selected ? 0.25 : 1}/>
                        )}
                        <circle cx={pos.cx} cy={pos.cy} r="5"
                            fill={color || (isHov ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)')}
                            stroke={color || (isHov ? 'rgba(255,255,255,0.6)' : '#2e2e44')}
                            strokeWidth="1.5"/>
                    </g>
                );
            })}
        </svg>
    );
};

const CustomerMessages = ({ user, targetTrainer }) => {
    const isMobile = useIsMobile();
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
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
    const [groupTab, setGroupTab]                   = useState('chat'); // 'chat' | 'program'
    const [groupPrograms, setGroupPrograms]         = useState([]);
    const [selectedGProg, setSelectedGProg]         = useState(null);
    const [gProgData, setGProgData]                 = useState([]);
    const [gProgDay, setGProgDay]                   = useState('Monday');
    const [gProgLogs, setGProgLogs]                 = useState([]);
    const [loadingGProg, setLoadingGProg]           = useState(false);
    const [logOpen, setLogOpen]                     = useState(null); // 'day|exIdx'
    const [logForm, setLogForm]                     = useState({ sets: '', reps: '', weight: '' });
    const [submittingLog, setSubmittingLog]         = useState(false);
    const [showPlusMenu, setShowPlusMenu]           = useState(false);
    const [showPainModal, setShowPainModal]         = useState(false);
    const [painZones, setPainZones]                 = useState([]);
    const [painActiveSev, setPainActiveSev]         = useState('Low');
    const [painNote, setPainNote]                   = useState('');
    const [painSent, setPainSent]                   = useState(false);
    const [painHovered, setPainHovered]             = useState(null);
    const [submittingPain, setSubmittingPain]       = useState(false);
    const bottomRef                   = useRef(null);
    const messagesContainerRef        = useRef(null);
    const groupMessagesContainerRef   = useRef(null);
    const pollRef                     = useRef(null);
    const inputRef                    = useRef(null);
    const plusMenuRef                 = useRef(null);
    const isInitialMsgLoad            = useRef(false);
    const isInitialGroupLoad          = useRef(false);

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
        isInitialMsgLoad.current = true;
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
        if (!messages.length) return;
        if (isInitialMsgLoad.current) {
            isInitialMsgLoad.current = false;
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        } else {
            const el = messagesContainerRef.current;
            if (!el) return;
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // ── When active group changes, load its messages ─────────────
    useEffect(() => {
        if (!activeGroup?.id) return;
        isInitialGroupLoad.current = true;
        setLoadingGroup(true);
        setGroupMessages([]);
        fetchGroupMessages(activeGroup.id).finally(() => setLoadingGroup(false));
        clearInterval(groupPollRef.current);
        groupPollRef.current = setInterval(() => fetchGroupMessages(activeGroup.id), 4000);
        return () => clearInterval(groupPollRef.current);
    }, [activeGroup?.id, fetchGroupMessages]);

    useEffect(() => {
        if (!groupMessages.length) return;
        if (isInitialGroupLoad.current) {
            isInitialGroupLoad.current = false;
            groupBottomRef.current?.scrollIntoView({ behavior: 'instant' });
        } else {
            const el = groupMessagesContainerRef.current;
            if (!el) return;
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (isNearBottom) groupBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
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
        if (isMobile) setMobileView('chat');
    };

    const G_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    const fetchGPrograms = useCallback(async (groupId) => {
        try {
            const res = await axios.get(`/api/v1/groups/${groupId}/programs`, { withCredentials: true });
            setGroupPrograms(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    const selectGProg = async (groupId, prog) => {
        setSelectedGProg(prog);
        setGProgDay('Monday');
        setLogOpen(null);
        setLoadingGProg(true);
        try {
            const [progRes, logsRes] = await Promise.all([
                axios.get(`/api/v1/groups/${groupId}/programs/${prog.id}`, { withCredentials: true }),
                axios.get(`/api/v1/groups/${groupId}/programs/${prog.id}/logs`, { withCredentials: true }),
            ]);
            setGProgData(progRes.data.data.programData || []);
            setGProgLogs(logsRes.data.data || []);
        } catch { /* silent */ } finally { setLoadingGProg(false); }
    };

    const handleLogExercise = async (groupId, progId, dayLabel, exerciseName) => {
        setSubmittingLog(true);
        try {
            await axios.post(`/api/v1/groups/${groupId}/programs/${progId}/log`, {
                dayLabel, exerciseName,
                setsCompleted: logForm.sets || null,
                repsCompleted: logForm.reps || null,
                weight: logForm.weight || null,
            }, { withCredentials: true });
            const logsRes = await axios.get(`/api/v1/groups/${groupId}/programs/${progId}/logs`, { withCredentials: true });
            setGProgLogs(logsRes.data.data || []);
            setLogOpen(null);
            setLogForm({ sets: '', reps: '', weight: '' });
        } catch { /* silent */ } finally { setSubmittingLog(false); }
    };

    const getMyLastLog = (dayLabel, exerciseName) => {
        return gProgLogs.find(l => l.dayLabel === dayLabel && l.exerciseName === exerciseName) || null;
    };

    const handleSelectGroup = (g) => {
        setActive(null);
        setActiveGroup({ id: g.id, name: g.name });
        setGroupTab('chat');
        setSelectedGProg(null);
        setGroupPrograms([]);
        if (isMobile) setMobileView('chat');
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

    const togglePainZone = (zoneName) => {
        setPainZones(prev => {
            const exists = prev.find(z => z.zone === zoneName);
            if (exists) return prev.filter(z => z.zone !== zoneName);
            return [...prev, { zone: zoneName, sev: painActiveSev }];
        });
    };

    const handleSubmitPain = async () => {
        if (painZones.length === 0) return;
        setSubmittingPain(true);
        try {
            for (const z of painZones) {
                await axios.post('/api/v1/users/report-pain', {
                    zone: z.zone,
                    severity: z.sev,
                    note: painNote,
                }, { withCredentials: true });
            }
            closePainModal();
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

    const goBackToList = () => {
        setMobileView('list');
        setActive(null);
        setActiveGroup(null);
    };

    // On mobile, show list OR chat — not both
    const showList = !isMobile || mobileView === 'list';
    const showChat = !isMobile || mobileView === 'chat';

    return (
        <div className={`cm-wrap ${isMobile ? 'cm-mobile' : ''}`}>
            {/* ── Sidebar ── */}
            <div className="cm-sidebar" style={isMobile && !showList ? { display: 'none' } : {}}>
                <div className="cm-sidebar-title">MESSAGES</div>
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
                                                <span className="cm-convo-preview">
                                                    {c.lastMessage?.startsWith('__WORKOUT__')
                                                        ? (() => { try { const w = JSON.parse(c.lastMessage.slice(11)); return `Workout: ${w.name || 'Program'}`; } catch { return 'Workout Program'; } })()
                                                        : (c.lastMessage?.slice(0, 35) || 'Start a conversation') + (c.lastMessage?.length > 35 ? '…' : '')
                                                    }
                                                </span>
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
            <div className="cm-container" style={isMobile && !showChat ? { display: 'none' } : {}}>
                {/* ── Group chat panel ── */}
                {activeGroup ? (
                    <>
                        <div className="cm-header">
                            {isMobile && (
                                <button className="cm-back-btn" onClick={goBackToList}>
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="cm-header-avatar cm-group-avatar"><Users size={16} /></div>
                            <div className="cm-header-info">
                                <h2>{activeGroup.name}</h2>
                                <span>Group</span>
                            </div>
                            <div className="cm-group-tabs">
                                <button
                                    className={`cm-group-tab ${groupTab === 'chat' ? 'active' : ''}`}
                                    onClick={() => setGroupTab('chat')}
                                >Chat</button>
                                <button
                                    className={`cm-group-tab ${groupTab === 'program' ? 'active' : ''}`}
                                    onClick={() => {
                                        setGroupTab('program');
                                        if (groupPrograms.length === 0) fetchGPrograms(activeGroup.id);
                                    }}
                                >Program</button>
                            </div>
                        </div>

                        {groupTab === 'chat' ? (
                            <>
                                <div className="cm-messages" ref={groupMessagesContainerRef}>
                                    {loadingGroup ? (
                                        <div className="cm-state"><Loader2 className="cm-spin" size={24} /><p>Loading…</p></div>
                                    ) : groupMessages.length === 0 ? null : (
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
                        ) : (
                            /* ── Program tab ── */
                            <div className="cm-prog-panel">
                                {!selectedGProg ? (
                                    groupPrograms.length === 0 ? (
                                        <div className="cm-state"><p>No programs assigned yet</p></div>
                                    ) : (
                                        <div className="cm-prog-list">
                                            {groupPrograms.map(p => (
                                                <button key={p.id} className="cm-prog-item" onClick={() => selectGProg(activeGroup.id, p)}>
                                                    <span className="cm-prog-item-name">{p.name}</span>
                                                    <span className="cm-prog-item-arrow">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <div className="cm-prog-detail-header">
                                            <button className="cm-prog-back" onClick={() => { setSelectedGProg(null); setLogOpen(null); }}>← Back</button>
                                            <span className="cm-prog-detail-name">{selectedGProg.name}</span>
                                        </div>
                                        {loadingGProg ? (
                                            <div className="cm-state"><Loader2 className="cm-spin" size={22} /></div>
                                        ) : (
                                            <>
                                                <div className="cm-prog-day-tabs">
                                                    {G_DAYS.map(d => {
                                                        const count = gProgData.find(x => x.day === d)?.exercises?.length || 0;
                                                        return (
                                                            <button
                                                                key={d}
                                                                className={`cm-prog-day-tab ${gProgDay === d ? 'active' : ''}`}
                                                                onClick={() => { setGProgDay(d); setLogOpen(null); }}
                                                            >
                                                                {d.slice(0,3)}{count > 0 && <span className="cm-prog-day-dot" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div className="cm-prog-exercises">
                                                    {(() => {
                                                        const exs = gProgData.find(d => d.day === gProgDay)?.exercises || [];
                                                        if (exs.length === 0) return <p className="cm-prog-no-ex">Rest day — no exercises</p>;
                                                        return exs.map((ex, idx) => {
                                                            const exName = ex.exerciseName || ex.name || 'Unnamed exercise';
                                                            return (
                                                                <div key={idx} className="cm-prog-ex-card">
                                                                    <div className="cm-prog-ex-row">
                                                                        <div className="cm-prog-ex-info">
                                                                            <span className="cm-prog-ex-name">{exName}</span>
                                                                            <span className="cm-prog-ex-prescription">{ex.sets} × {ex.reps}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                ) : !active ? (
                    <div className="cm-state" style={{ height: '100%' }}>
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="cm-header">
                            {isMobile && (
                                <button className="cm-back-btn" onClick={goBackToList}>
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <div className="cm-header-avatar">{active.name?.charAt(0).toUpperCase()}</div>
                            <div className="cm-header-info">
                                <h2>{active.name}</h2>
                                <span><span className="cm-header-online-dot" />Online · Personal Trainer</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="cm-messages" ref={messagesContainerRef}>
                            {loadingMsgs ? (
                                <div className="cm-state">
                                    <Loader2 className="cm-spin" size={24} />
                                    <p>Loading…</p>
                                </div>
                            ) : messages.length === 0 ? null : (
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
                                                        {(expandedWorkouts.has(msg.id) ? (workout.exercises || []) : (workout.exercises || []).slice(0, 4)).map((ex, j) => (
                                                            <div key={j} className="cm-workout-ex">
                                                                {ex.exerciseName}{ex.sets ? ` · ${ex.sets}×${ex.reps || '?'}` : ''}
                                                            </div>
                                                        ))}
                                                        {(workout.exercises || []).length > 4 && (
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
                                    <>

                                            {/* Header */}
                                            <div className="cm-pain-top">
                                                <h2 className="cm-pain-title">Report Your Pain</h2>
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
                                                    {painZones.length === 0 ? null : (
                                                        <div className="cm-pain-zone-list">
                                                            {painZones.map(z => {
                                                                const meta = SEV_META[z.sev];
                                                                return (
                                                                    <div
                                                                        key={z.zone}
                                                                        className="cm-pain-zone-row"
                                                                        onMouseEnter={() => setPainHovered(z.zone)}
                                                                        onMouseLeave={() => setPainHovered(null)}
                                                                        style={{ background: painHovered === z.zone ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)' }}
                                                                    >
                                                                        <span className="cm-pain-zone-dot" style={{ background: meta.color }} />
                                                                        <span className="cm-pain-zone-name">{z.zone}</span>
                                                                        <span className="cm-pain-zone-sev" style={{ color: meta.color }}>{z.sev}</span>
                                                                        <button
                                                                            type="button"
                                                                            className="cm-pain-zone-del"
                                                                            onClick={() => setPainZones(p => p.filter(x => x.zone !== z.zone))}
                                                                        >×</button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    <textarea
                                                        className="cm-pain-note"
                                                        placeholder="Add a note"
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
