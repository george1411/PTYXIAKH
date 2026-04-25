import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Plus, X, Search, Send, Loader2, Users, Trash2 } from 'lucide-react';
import './TrainerGroups.css';

// ─── Group Chat Panel ─────────────────────────────────────────
const GroupChatPanel = ({ group, currentUserId }) => {
    const [messages, setMessages]   = useState([]);
    const [text, setText]           = useState('');
    const [sending, setSending]     = useState(false);
    const [loading, setLoading]     = useState(true);
    const bottomRef                 = useRef(null);
    const pollRef                   = useRef(null);
    const inputRef                  = useRef(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await axios.get(`/api/v1/groups/${group.id}/messages`, { withCredentials: true });
            setMessages(res.data.data || []);
        } catch { /* silent */ }
    }, [group.id]);

    useEffect(() => {
        setLoading(true);
        setMessages([]);
        fetchMessages().finally(() => setLoading(false));
        pollRef.current = setInterval(fetchMessages, 4000);
        return () => clearInterval(pollRef.current);
    }, [group.id, fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            await axios.post(`/api/v1/groups/${group.id}/messages`, { content: text.trim() }, { withCredentials: true });
            setText('');
            await fetchMessages();
            inputRef.current?.focus();
        } catch { /* silent */ } finally { setSending(false); }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const diff = Date.now() - d;
        const mins = Math.floor(diff / 60000);
        if (mins < 1)  return 'now';
        if (mins < 60) return `${mins}m`;
        if (mins < 1440) return `${Math.floor(mins / 60)}h`;
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatDateSep = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const label = d.toDateString() === today.toDateString() ? 'Today'
            : d.toDateString() === yesterday.toDateString() ? 'Yesterday'
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${label} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="tg-chat">
            <div className="tg-messages">
                {loading ? (
                    <div className="tg-state"><Loader2 className="tg-spin" size={20} /></div>
                ) : messages.length === 0 ? (
                    <div className="tg-state"><p>No messages yet — start the conversation!</p></div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.senderId === currentUserId;
                        const prev = messages[i - 1];
                        const showSep = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                        const showName = !isMe && (!prev || prev.senderId !== msg.senderId || showSep);
                        return (
                            <React.Fragment key={msg.id}>
                                {showSep && (
                                    <div className="tg-date-sep"><span>{formatDateSep(msg.createdAt)}</span></div>
                                )}
                                <div className={`tg-msg-row ${isMe ? 'me' : 'them'}`}>
                                    {!isMe && (
                                        <div className="tg-avatar">
                                            {(msg.senderName || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="tg-bubble-wrap">
                                        {showName && <span className="tg-sender-name">{msg.senderName}</span>}
                                        <div className={`tg-bubble ${isMe ? 'me' : 'them'}`}>
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                    <span className="tg-time">{formatTime(msg.createdAt)}</span>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form className="tg-input-row" onSubmit={handleSend}>
                <input
                    ref={inputRef}
                    className="tg-input"
                    placeholder={`Message ${group.name}…`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={sending}
                />
                <button className="tg-send" type="submit" disabled={sending || !text.trim()}>
                    {sending ? <Loader2 className="tg-spin" size={16} /> : <Send size={16} />}
                </button>
            </form>
        </div>
    );
};

// ─── Members Panel ────────────────────────────────────────────
const MembersPanel = ({ group, allClients, onGroupUpdated }) => {
    const [members, setMembers]     = useState(group.members || []);
    const [search, setSearch]       = useState('');
    const [saving, setSaving]       = useState(false);

    const memberIds = new Set(members.map(m => m.id));
    const available = allClients.filter(c => !memberIds.has(c.id) && c.name.toLowerCase().includes(search.toLowerCase()));

    const addMember = async (client) => {
        setSaving(true);
        try {
            await axios.post(`/api/v1/groups/${group.id}/members`, { userId: client.id }, { withCredentials: true });
            setMembers(prev => [...prev, { id: client.id, name: client.name }]);
            onGroupUpdated();
        } catch { /* silent */ } finally { setSaving(false); }
    };

    const removeMember = async (userId) => {
        try {
            await axios.delete(`/api/v1/groups/${group.id}/members/${userId}`, { withCredentials: true });
            setMembers(prev => prev.filter(m => m.id !== userId));
            onGroupUpdated();
        } catch { /* silent */ }
    };

    return (
        <div className="tg-members">
            <div className="tg-members-section">
                <div className="tg-members-label">Current members ({members.length})</div>
                {members.length === 0 ? (
                    <div className="tg-members-empty">No members yet. Add clients below.</div>
                ) : (
                    <div className="tg-member-list">
                        {members.map(m => (
                            <div key={m.id} className="tg-member-row">
                                <div className="tg-member-avatar">{m.name.charAt(0).toUpperCase()}</div>
                                <span className="tg-member-name">{m.name}</span>
                                <button className="tg-member-remove" onClick={() => removeMember(m.id)} title="Remove">
                                    <X size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="tg-members-section">
                <div className="tg-members-label">Add clients</div>
                <div className="tg-member-search-wrap">
                    <Search size={13} className="tg-member-search-icon" />
                    <input
                        className="tg-member-search"
                        placeholder="Search clients…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {available.length === 0 ? (
                    <div className="tg-members-empty">{search ? 'No match.' : 'All clients already added.'}</div>
                ) : (
                    <div className="tg-member-list">
                        {available.map(c => (
                            <div key={c.id} className="tg-member-row">
                                <div className="tg-member-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                <span className="tg-member-name">{c.name}</span>
                                <button
                                    className="tg-member-add"
                                    onClick={() => addMember(c)}
                                    disabled={saving}
                                >
                                    <Plus size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Create Group Modal ───────────────────────────────────────
const CreateGroupModal = ({ allClients, onCreated, onClose }) => {
    const [name, setName]           = useState('');
    const [selected, setSelected]   = useState([]);
    const [search, setSearch]       = useState('');
    const [saving, setSaving]       = useState(false);

    const toggle = (client) => {
        setSelected(prev =>
            prev.find(c => c.id === client.id)
                ? prev.filter(c => c.id !== client.id)
                : [...prev, client]
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await axios.post('/api/v1/groups', {
                name: name.trim(),
                memberIds: selected.map(c => c.id),
            }, { withCredentials: true });
            onCreated(res.data.data);
        } catch { /* silent */ } finally { setSaving(false); }
    };

    const filtered = allClients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="tg-modal-overlay" onClick={onClose}>
            <div className="tg-modal" onClick={e => e.stopPropagation()}>
                <div className="tg-modal-header">
                    <span className="tg-modal-title">New Group</span>
                    <button className="tg-modal-close" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="tg-modal-body">
                    <label className="tg-modal-label">Group name</label>
                    <input
                        className="tg-modal-input"
                        placeholder="e.g. Monday Morning Class"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        autoFocus
                    />

                    <label className="tg-modal-label" style={{ marginTop: 16 }}>
                        Add members ({selected.length} selected)
                    </label>
                    <div className="tg-member-search-wrap">
                        <Search size={13} className="tg-member-search-icon" />
                        <input
                            className="tg-member-search"
                            placeholder="Search clients…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="tg-modal-client-list">
                        {filtered.map(c => {
                            const isSelected = !!selected.find(s => s.id === c.id);
                            return (
                                <button
                                    key={c.id}
                                    className={`tg-modal-client-row ${isSelected ? 'selected' : ''}`}
                                    onClick={() => toggle(c)}
                                >
                                    <div className="tg-member-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                    <span className="tg-member-name">{c.name}</span>
                                    {isSelected && <span className="tg-modal-check">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="tg-modal-footer">
                    <button className="tg-modal-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="tg-modal-create"
                        disabled={!name.trim() || saving}
                        onClick={handleCreate}
                    >
                        {saving ? <Loader2 className="tg-spin" size={14} /> : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main TrainerGroups Component ─────────────────────────────
const TrainerGroups = ({ user }) => {
    const [groups, setGroups]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupDetail, setGroupDetail]     = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [activeTab, setActiveTab]         = useState('members');
    const [allClients, setAllClients]       = useState([]);
    const [showCreate, setShowCreate]       = useState(false);
    const [deleting, setDeleting]           = useState(false);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/groups', { withCredentials: true });
            setGroups(res.data.data || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetchGroups(),
            axios.get('/api/v1/trainer/clients', { withCredentials: true }).then(r => setAllClients(r.data.data || [])),
        ]).finally(() => setLoading(false));
    }, [fetchGroups]);

    const selectGroup = async (g) => {
        setSelectedGroup(g);
        setActiveTab('members');
        setGroupDetail(null);
        setLoadingDetail(true);
        try {
            const res = await axios.get(`/api/v1/groups/${g.id}`, { withCredentials: true });
            setGroupDetail(res.data.data);
        } catch { /* silent */ } finally { setLoadingDetail(false); }
    };

    const handleCreated = (newGroup) => {
        setShowCreate(false);
        fetchGroups();
        selectGroup(newGroup);
    };

    const handleDeleteGroup = async () => {
        if (!selectedGroup) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/v1/groups/${selectedGroup.id}`, { withCredentials: true });
            setSelectedGroup(null);
            setGroupDetail(null);
            await fetchGroups();
        } catch { /* silent */ } finally { setDeleting(false); }
    };

    return (
        <div className="tg-container">
            {/* ── Left: group list ── */}
            <div className="tg-left">
                <div className="tg-left-header">
                    <span className="tg-left-title">Groups</span>
                    <button className="tg-new-btn" onClick={() => setShowCreate(true)}>
                        <Plus size={14} /> New
                    </button>
                </div>

                {loading ? (
                    <div className="tg-empty"><Loader2 className="tg-spin" size={20} /></div>
                ) : groups.length === 0 ? (
                    <div className="tg-empty">
                        <Users size={28} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
                        <p>No groups yet.<br />Create one to get started.</p>
                    </div>
                ) : (
                    <div className="tg-group-list">
                        {groups.map(g => (
                            <button
                                key={g.id}
                                className={`tg-group-item ${selectedGroup?.id === g.id ? 'selected' : ''}`}
                                onClick={() => selectGroup(g)}
                            >
                                <div className="tg-group-icon">
                                    <Users size={14} />
                                </div>
                                <div className="tg-group-info">
                                    <span className="tg-group-name">{g.name}</span>
                                    <span className="tg-group-sub">{g.memberCount} member{g.memberCount !== 1 ? 's' : ''}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right: detail ── */}
            <div className="tg-right">
                {!selectedGroup ? (
                    <div className="tg-no-selection">
                        <Users size={36} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: 12 }} />
                        <p>Select a group to manage it</p>
                    </div>
                ) : (
                    <>
                        <div className="tg-group-header">
                            <div className="tg-group-header-icon"><Users size={18} /></div>
                            <div className="tg-group-header-info">
                                <h2>{selectedGroup.name}</h2>
                                <span>{groupDetail?.members?.length ?? selectedGroup.memberCount} members</span>
                            </div>
                            <button
                                className="tg-delete-btn"
                                onClick={handleDeleteGroup}
                                disabled={deleting}
                                title="Delete group"
                            >
                                {deleting ? <Loader2 className="tg-spin" size={14} /> : <Trash2 size={14} />}
                            </button>
                        </div>

                        <div className="tg-inner-tabs">
                            <button className={`tg-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
                            <button className={`tg-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Group Chat</button>
                        </div>

                        {loadingDetail ? (
                            <div className="tg-empty"><Loader2 className="tg-spin" size={20} /></div>
                        ) : activeTab === 'members' ? (
                            <MembersPanel
                                group={groupDetail || selectedGroup}
                                allClients={allClients}
                                onGroupUpdated={() => {
                                    fetchGroups();
                                    selectGroup(selectedGroup);
                                }}
                            />
                        ) : (
                            <GroupChatPanel group={selectedGroup} currentUserId={user?.id} />
                        )}
                    </>
                )}
            </div>

            {showCreate && (
                <CreateGroupModal
                    allClients={allClients}
                    onCreated={handleCreated}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </div>
    );
};

export default TrainerGroups;
