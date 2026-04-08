import React, { useState, useEffect, useRef } from 'react';
import { Check, User } from 'lucide-react';
import axios from 'axios';
import './Settings.css';

const Toast = ({ message, type, onClear }) => {
    useEffect(() => {
        const t = setTimeout(onClear, 3000);
        return () => clearTimeout(t);
    }, [onClear]);
    return <div className={`settings-toast ${type}`}>{message}</div>;
};

// ─── Profile Section ─────────────────────────────────────────
const ProfileSection = ({ user, onUpdate, isTrainer = false }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [age, setAge] = useState(user?.age || '');
    const [gender, setGender] = useState(user?.gender || '');
    const [height, setHeight] = useState(user?.height || '');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.profileImage || null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAge(user.age || '');
            setGender(user.gender || '');
            setHeight(user.height || '');
            setAvatarPreview(user.profileImage || null);
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
            if (onUpdate) onUpdate({ ...user, profileImage: newImage });
            setToast({ message: 'Profile picture updated!', type: 'success' });
        } catch {
            setToast({ message: 'Failed to upload image.', type: 'error' });
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put('/api/v1/auth/profile', {
                name, email,
                age: age ? parseInt(age) : null,
                gender: gender || null,
                height: height ? parseFloat(height) : null
            }, { withCredentials: true });
            setToast({ message: 'Profile updated!', type: 'success' });
            if (onUpdate) onUpdate(res.data.data.user);
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to update.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h3>Profile</h3>
            </div>
            {toast && <Toast {...toast} onClear={() => setToast(null)} />}
            <div className="settings-avatar-row">
                <div className="settings-avatar-wrap" onClick={() => avatarInputRef.current?.click()}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="settings-avatar-img" />
                    ) : (
                        <div className="settings-avatar-placeholder">
                            <User size={28} />
                        </div>
                    )}
                    <div className="settings-avatar-overlay">
                        {uploadingAvatar ? '…' : 'Change'}
                    </div>
                </div>
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                />
            </div>
            <div className="settings-form">
                <div className="settings-row">
                    <div className="settings-field">
                        <label className="settings-label">Name</label>
                        <input className="settings-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">Email</label>
                        <input className="settings-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                    </div>
                </div>
                <div className="settings-row">
                    <div className="settings-field">
                        <label className="settings-label">Age</label>
                        <input className="settings-input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 25" min="10" max="100" />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">Gender</label>
                        <select className="settings-input" value={gender} onChange={e => setGender(e.target.value)}>
                            <option value="">Select...</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                    </div>
                    {!isTrainer && (
                        <div className="settings-field">
                            <label className="settings-label">Height (cm)</label>
                            <input className="settings-input" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" min="100" max="250" step="0.1" />
                        </div>
                    )}
                </div>
                <button className="settings-btn settings-btn-primary" onClick={handleSave} disabled={saving}>
                    <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// ─── Goals Section ───────────────────────────────────────────
const GoalsSection = ({ user }) => {
    const [calories, setCalories] = useState(user?.dailyCalorieTarget || 2500);
    const [protein, setProtein] = useState(user?.dailyProteinTarget || 150);
    const [weightGoal, setWeightGoal] = useState(() => localStorage.getItem('weightGoal') || '');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save calorie/protein to DailyGoal backend
            await axios.post('/api/v1/dailygoals/update', {
                calories: parseInt(calories),
                protein: parseInt(protein),
            }, { withCredentials: true });

            // Save weight goal to localStorage
            if (weightGoal) {
                localStorage.setItem('weightGoal', weightGoal);
            } else {
                localStorage.removeItem('weightGoal');
            }

            setToast({ message: 'Goals updated!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to update goals.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h3>Daily Goals</h3>
            </div>
            {toast && <Toast {...toast} onClear={() => setToast(null)} />}
            <div className="settings-form">
                <div className="settings-row">
                    <div className="settings-field">
                        <label className="settings-label">Calorie Target (kcal)</label>
                        <input className="settings-input" type="number" value={calories} onChange={e => setCalories(e.target.value)} />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">Protein Target (g)</label>
                        <input className="settings-input" type="number" value={protein} onChange={e => setProtein(e.target.value)} />
                    </div>
                </div>
                <div className="settings-field">
                    <label className="settings-label">Weight Goal (kg)</label>
                    <input className="settings-input" type="number" value={weightGoal} onChange={e => setWeightGoal(e.target.value)} placeholder="e.g. 75" style={{ maxWidth: '200px' }} />
                </div>
                <button className="settings-btn settings-btn-primary" onClick={handleSave} disabled={saving}>
                    <Check size={16} /> {saving ? 'Saving...' : 'Save Goals'}
                </button>
            </div>
        </div>
    );
};


// ─── Password Section ────────────────────────────────────────
const PasswordSection = () => {
    const [current, setCurrent] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSave = async () => {
        if (newPw !== confirm) {
            setToast({ message: 'Passwords do not match.', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            await axios.put('/api/v1/auth/change-password', {
                currentPassword: current,
                newPassword: newPw,
            }, { withCredentials: true });
            setToast({ message: 'Password changed!', type: 'success' });
            setCurrent(''); setNewPw(''); setConfirm('');
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to change password.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h3>Change Password</h3>
            </div>
            {toast && <Toast {...toast} onClear={() => setToast(null)} />}
            <div className="settings-form">
                <div className="settings-field">
                    <label className="settings-label">Current Password</label>
                    <input className="settings-input" type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="settings-row">
                    <div className="settings-field">
                        <label className="settings-label">New Password</label>
                        <input className="settings-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
                    </div>
                    <div className="settings-field">
                        <label className="settings-label">Confirm Password</label>
                        <input className="settings-input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" />
                    </div>
                </div>
                <button className="settings-btn settings-btn-primary" onClick={handleSave} disabled={saving || !current || !newPw}>
                    <Check size={16} /> {saving ? 'Changing...' : 'Change Password'}
                </button>
            </div>
        </div>
    );
};

// ─── Connect to Trainer ──────────────────────────────────────
const TrainerSection = ({ user }) => {
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [trainerName, setTrainerName] = useState(null);

    useEffect(() => {
        // Check if already linked
        if (user?.trainerId) {
            axios.get(`/api/v1/users/${user.trainerId}`, { withCredentials: true })
                .then(res => setTrainerName(res.data?.data?.name || 'your trainer'))
                .catch(() => {});
        }
    }, [user?.trainerId]);

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setSaving(true);
        try {
            const res = await axios.post('/api/v1/invite/redeem', { code }, { withCredentials: true });
            setTrainerName(res.data.data.trainerName);
            setCode('');
            setToast({ message: `Connected to ${res.data.data.trainerName}!`, type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Invalid code.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h3>Connect to Trainer</h3>
            </div>
            {toast && <Toast {...toast} onClear={() => setToast(null)} />}
            {trainerName ? (
                <p className="settings-trainer-linked">You are currently linked to <strong>{trainerName}</strong>. Enter a new code below to switch trainers.</p>
            ) : (
                <p className="settings-trainer-hint">Ask your trainer for an invite code and enter it below to connect with them.</p>
            )}
            <div className="settings-form">
                <div className="settings-row" style={{ alignItems: 'flex-end' }}>
                    <div className="settings-field">
                        <label className="settings-label">Invite Code</label>
                        <input
                            className="settings-input settings-input-mono"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. ALEX-4829"
                            maxLength={10}
                        />
                    </div>
                    <button className="settings-btn settings-btn-primary" onClick={handleRedeem} disabled={saving || !code.trim()}>
                        <Check size={16} /> {saving ? 'Connecting…' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Fitbit Connection ────────────────────────────────────────
const FitbitSection = () => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        axios.get('/api/v1/fitbit/status', { withCredentials: true })
            .then(res => setConnected(res.data.connected))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleConnect = () => {
        window.location.href = '/api/v1/fitbit/connect';
    };

    const handleDisconnect = async () => {
        try {
            await axios.delete('/api/v1/fitbit/disconnect', { withCredentials: true });
            setConnected(false);
            setToast({ message: 'Fitbit disconnected.', type: 'success' });
        } catch {
            setToast({ message: 'Failed to disconnect.', type: 'error' });
        }
    };

    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <h3>Fitbit</h3>
            </div>
            {toast && <Toast {...toast} onClear={() => setToast(null)} />}
            {loading ? null : connected ? (
                <>
                    <p className="settings-trainer-linked">Your Fitbit account is connected. Steps sync automatically from the Weekly Steps widget.</p>
                    <div className="settings-fitbit-actions">
                        <button className="settings-btn settings-btn-primary" onClick={() => { window.location.href = '/api/v1/fitbit/switch'; }}>
                            Switch Fitbit Account
                        </button>
                        <button className="settings-btn settings-btn-danger" onClick={handleDisconnect}>
                            Disconnect
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="settings-trainer-hint">Connect your Fitbit account to automatically sync your daily steps.</p>
                    <button className="settings-btn settings-btn-primary" onClick={handleConnect}>
                        Connect Fitbit
                    </button>
                </>
            )}
        </div>
    );
};

// ─── Danger Zone ─────────────────────────────────────────────
const DangerSection = ({ onLogout }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete('/api/v1/auth/delete-account', { withCredentials: true });
            if (onLogout) onLogout();
        } catch (err) {
            console.error('Delete failed:', err);
        } finally {
            setDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <div className="settings-section settings-danger">
                <div className="settings-section-header">
                    <h3>Danger Zone</h3>
                </div>
                <p className="settings-danger-text">
                    Deleting your account is permanent and cannot be undone. All your data, including workouts, measurements, and progress history, will be permanently removed.
                </p>
                <button className="settings-btn settings-btn-danger" onClick={() => setShowConfirm(true)}>
                    Delete Account
                </button>
            </div>

            {showConfirm && (
                <div className="settings-confirm-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="settings-confirm-dialog" onClick={e => e.stopPropagation()}>
                        <h3>Delete Account?</h3>
                        <p>This action is permanent. All your data will be lost forever.</p>
                        <div className="settings-confirm-actions">
                            <button className="settings-confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="settings-confirm-delete" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─── Main Settings Page ──────────────────────────────────────
const Settings = ({ user, onLogout, onUserUpdate, isTrainer = false }) => {
    return (
        <div className="settings-page">
            <div className="settings-header">
                <h2>Settings</h2>
            </div>

            <ProfileSection user={user} onUpdate={u => { if (onUserUpdate) onUserUpdate(u); }} isTrainer={isTrainer} />
            {!isTrainer && <GoalsSection user={user} />}
            {!isTrainer && <TrainerSection user={user} />}
            {!isTrainer && <FitbitSection />}
            <PasswordSection />
            <DangerSection onLogout={onLogout} />
        </div>
    );
};

export default Settings;
