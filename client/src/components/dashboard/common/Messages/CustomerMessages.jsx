import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Send, Loader2 } from 'lucide-react';
import './CustomerMessages.css';

const CustomerMessages = ({ user, targetTrainer }) => {
    const [convos, setConvos]         = useState([]);
    const [active, setActive]         = useState(null); // { id, name }
    const [messages, setMessages]     = useState([]);
    const [text, setText]             = useState('');
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs]    = useState(false);
    const [sending, setSending]       = useState(false);
    const bottomRef                   = useRef(null);
    const pollRef                     = useRef(null);
    const inputRef                    = useRef(null);

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

    const myId = user?.id;

    return (
        <div className="cm-wrap">
            {/* ── Sidebar ── */}
            <div className="cm-sidebar">
                <div className="cm-sidebar-title">Messages</div>

                {loadingConvos ? (
                    <div className="cm-sidebar-empty"><Loader2 className="cm-spin" size={20} /></div>
                ) : convos.length === 0 ? (
                    <div className="cm-sidebar-empty">No conversations yet.</div>
                ) : (
                    convos.map(c => (
                        <button
                            key={c.id}
                            className={`cm-convo-item ${active?.id === c.id ? 'active' : ''}`}
                            onClick={() => handleSelect(c)}
                        >
                            <div className="cm-convo-avatar">{c.name?.charAt(0).toUpperCase()}</div>
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
                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showSep && (
                                                <div className="cm-date-sep">
                                                    <span>{formatDateSep(msg.createdAt)}</span>
                                                </div>
                                            )}
                                            <div className={`cm-msg-row ${isMe ? 'me' : 'them'}`}>
                                                {!isMe && (
                                                    <div className="cm-avatar">
                                                        {(msg.Sender?.name || active.name || 'T').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className={`cm-bubble ${isMe ? 'me' : 'them'}`}>
                                                    <p>{msg.content}</p>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <form className="cm-input-row" onSubmit={handleSend}>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default CustomerMessages;
