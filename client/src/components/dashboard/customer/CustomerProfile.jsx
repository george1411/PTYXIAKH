import React, { useState, useEffect, useRef } from 'react';
import { Save, Edit3, CheckCircle, User, Upload, MapPin, Phone, Star, Users, MessageCircle } from 'lucide-react';
import axios from 'axios';
import './CustomerProfile.css';

const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
];


const CustomerProfile = ({ user, onLogout, onUserUpdate }) => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        age: '',
        gender: '',
        height: '',
    });
    const [trainer, setTrainer] = useState(null);
    const [loadingTrainer, setLoadingTrainer] = useState(false);
    const [weightGoal, setWeightGoal] = useState(() => localStorage.getItem('weightGoal') || '');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState('');
    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                age: user.age || '',
                gender: user.gender || '',
                height: user.height || '',
            });
            setAvatarPreview(user.profileImage || null);

            if (user.trainerId) {
                setLoadingTrainer(true);
                axios.get(`/api/v1/trainer/${user.trainerId}/public`, { withCredentials: true })
                    .then(res => { if (res.data.success) setTrainer(res.data.data); })
                    .catch(() => {})
                    .finally(() => setLoadingTrainer(false));
            }
        }
    }, [user?.id]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const res = await axios.post('/api/v1/auth/avatar', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newImage = res.data.data.profileImage;
            setAvatarPreview(newImage);
            if (onUserUpdate) onUserUpdate({ ...user, profileImage: newImage });
        } catch {
            setError('Failed to upload image.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await axios.put('/api/v1/auth/profile', {
                name: form.name,
                email: form.email,
                age: form.age ? parseInt(form.age) : null,
                gender: form.gender || null,
                height: form.height ? parseFloat(form.height) : null,
            }, { withCredentials: true });
            if (res.data.success) {
                if (onUserUpdate) onUserUpdate(res.data.data.user);
                if (weightGoal) localStorage.setItem('weightGoal', weightGoal);
                else localStorage.removeItem('weightGoal');
                setSaved(true);
                setEditing(false);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save.');
            setTimeout(() => setError(''), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            age: user?.age || '',
            gender: user?.gender || '',
            height: user?.height || '',
        });
        setEditing(false);
        setError('');
    };

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="cp-container">
            {/* Header */}
            <div className="cp-header">
                <div className="cp-header-left">
                    <div className="cp-avatar-wrap">
                        {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" className="cp-avatar-img" />
                            : <div className="cp-avatar-placeholder"><User size={34} /></div>
                        }
                        {editing && (
                            <label className="cp-avatar-overlay">
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    ref={avatarInputRef}
                                    onChange={handleAvatarChange}
                                />
                                {uploadingAvatar ? '...' : <Upload size={16} />}
                            </label>
                        )}
                    </div>
                    <div className="cp-header-info">
                        <h1 className="cp-name">{user?.name || 'Member'}</h1>
                        <p className="cp-email">{user?.email || ''}</p>
                        <div className="cp-badges">
                            <span className="cp-badge cp-badge-role">Member</span>
                            {user?.age && <span className="cp-badge cp-badge-detail">{user.age} yrs</span>}
                            {user?.gender && <span className="cp-badge cp-badge-detail">{user.gender === 'M' ? 'Male' : 'Female'}</span>}
                            {user?.height && <span className="cp-badge cp-badge-detail">{user.height} cm</span>}
                        </div>
                    </div>
                </div>
                <div className="cp-header-actions">
                    {!editing && onLogout && (
                        <button
                            className="cp-btn-signout"
                            onClick={onLogout}
                            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            Sign out
                        </button>
                    )}
                    {!editing ? (
                        <button className="cp-btn cp-btn-edit" onClick={() => setEditing(true)}>
                            <Edit3 size={15} /> Edit Profile
                        </button>
                    ) : (
                        <div className="cp-btn-group">
                            <button className="cp-btn cp-btn-cancel" onClick={handleCancel}>Cancel</button>
                            <button className="cp-btn cp-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving…' : <><Save size={15} /> Save</>}
                            </button>
                        </div>
                    )}
                    {error && <span className="cp-error-msg">{error}</span>}
                </div>
            </div>

            <div className="cp-grid">
                {/* Personal Info */}
                <div className="cp-card">
                    <div className="cp-card-header"><h2>Personal Info</h2></div>
                    <div className="cp-fields">
                        <div className="cp-field">
                            <label>Full Name</label>
                            {editing
                                ? <input className="cp-input" value={form.name} onChange={set('name')} placeholder="Your name" />
                                : <span>{form.name || '—'}</span>
                            }
                        </div>
                        <div className="cp-field">
                            <label>Email</label>
                            {editing
                                ? <input className="cp-input" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
                                : <span>{form.email || '—'}</span>
                            }
                        </div>
                        <div className="cp-field">
                            <label>Age</label>
                            {editing
                                ? <input className="cp-input cp-input-small" type="number" min="10" max="100" value={form.age} onChange={set('age')} placeholder="—" />
                                : <span>{form.age || '—'}</span>
                            }
                        </div>
                        <div className="cp-field">
                            <label>Gender</label>
                            {editing ? (
                                <select className="cp-input" value={form.gender} onChange={set('gender')}>
                                    <option value="">Select…</option>
                                    {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                </select>
                            ) : (
                                <span>{form.gender === 'M' ? 'Male' : form.gender === 'F' ? 'Female' : '—'}</span>
                            )}
                        </div>
                        <div className="cp-field">
                            <label>Height (cm)</label>
                            {editing
                                ? <input className="cp-input cp-input-small" type="number" min="100" max="250" value={form.height} onChange={set('height')} placeholder="—" />
                                : <span>{form.height ? `${form.height} cm` : '—'}</span>
                            }
                        </div>
                        <div className="cp-field">
                            <label>Weight Goal (kg)</label>
                            {editing
                                ? <input className="cp-input cp-input-small" type="number" min="30" max="300" step="0.1" value={weightGoal} onChange={e => setWeightGoal(e.target.value)} placeholder="e.g. 75" />
                                : <span>{weightGoal ? `${weightGoal} kg` : '—'}</span>
                            }
                        </div>
                    </div>
                </div>

                {/* My Trainer */}
                <div className="cp-card">
                    <div className="cp-card-header"><h2>My Trainer</h2></div>
                    {loadingTrainer ? (
                        <div className="cp-trainer-loading"><div className="cp-spinner" /></div>
                    ) : !user?.trainerId || !trainer ? (
                        <p className="cp-placeholder">No trainer assigned yet.</p>
                    ) : (
                        <div className="cp-trainer">
                            <div className="cp-trainer-top">
                                <div className="cp-trainer-avatar">
                                    {trainer.profileImage
                                        ? <img src={trainer.profileImage} alt="trainer" className="cp-trainer-avatar-img" />
                                        : <User size={28} />
                                    }
                                </div>
                                <div className="cp-trainer-info">
                                    <span className="cp-trainer-name">{trainer.name}</span>
                                    <span className="cp-trainer-email">{trainer.email}</span>
                                    <div className="cp-trainer-meta">
                                        {trainer.experienceYears > 0 && (
                                            <span className="cp-trainer-chip"><Star size={11} /> {trainer.experienceYears} yrs exp</span>
                                        )}
                                        {trainer.clientCount > 0 && (
                                            <span className="cp-trainer-chip"><Users size={11} /> {trainer.clientCount} clients</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {trainer.bio && (
                                <p className="cp-trainer-bio">{trainer.bio}</p>
                            )}

                            <div className="cp-trainer-details">
                                {trainer.location && (
                                    <div className="cp-trainer-detail"><MapPin size={13} />{trainer.location}</div>
                                )}
                                {trainer.phone && (
                                    <div className="cp-trainer-detail"><Phone size={13} />{trainer.phone}</div>
                                )}
                            </div>

                            {trainer.specializations?.length > 0 && (
                                <div className="cp-trainer-specs">
                                    {trainer.specializations.slice(0, 4).map(s => (
                                        <span key={s} className="cp-trainer-spec">{s}</span>
                                    ))}
                                    {trainer.specializations.length > 4 && (
                                        <span className="cp-trainer-spec cp-trainer-spec-more">+{trainer.specializations.length - 4}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
