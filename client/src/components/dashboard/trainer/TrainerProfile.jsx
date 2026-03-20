import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Edit3, CheckCircle, Upload, ExternalLink, User } from 'lucide-react';
import axios from 'axios';
import './TrainerProfile.css';

const SPECIALIZATION_OPTIONS = [
    'Weight Loss', 'Muscle Building', 'Powerlifting', 'CrossFit',
    'Yoga', 'Rehabilitation', 'Sports Performance', 'Nutrition',
    'Bodybuilding', 'Functional Training', 'HIIT', 'Flexibility & Mobility',
    'Endurance Training', 'Strength & Conditioning', 'Pre/Post Natal'
];

const TrainerProfile = ({ user }) => {
    const [profile, setProfile] = useState({
        bio: '',
        specializations: [],
        certifications: [],
        experienceYears: 0,
        phone: '',
        location: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newCert, setNewCert] = useState('');
    const [uploading, setUploading] = useState(null); // index of cert being uploaded
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('/api/v1/trainer/profile', { withCredentials: true });
                if (res.data.success) {
                    setProfile(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch trainer profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await axios.put('/api/v1/trainer/profile', {
                bio: profile.bio,
                specializations: profile.specializations,
                certifications: profile.certifications,
                experienceYears: profile.experienceYears,
                phone: profile.phone,
                location: profile.location
            }, { withCredentials: true });
            if (res.data.success) {
                setProfile(res.data.data);
                setSaved(true);
                setEditing(false);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Failed to save profile', err);
        } finally {
            setSaving(false);
        }
    };

    const toggleSpecialization = (spec) => {
        setProfile(prev => ({
            ...prev,
            specializations: prev.specializations.includes(spec)
                ? prev.specializations.filter(s => s !== spec)
                : [...prev.specializations, spec]
        }));
    };

    const addCertification = () => {
        if (newCert.trim()) {
            const exists = profile.certifications.some(c =>
                (typeof c === 'string' ? c : c.name) === newCert.trim()
            );
            if (!exists) {
                setProfile(prev => ({
                    ...prev,
                    certifications: [...prev.certifications, { name: newCert.trim(), fileUrl: null }]
                }));
                setNewCert('');
            }
        }
    };

    const removeCertification = (index) => {
        setProfile(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const handleFileUpload = async (index, file) => {
        if (!file) return;
        setUploading(index);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post('/api/v1/trainer/upload-cert', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setProfile(prev => {
                    const certs = [...prev.certifications];
                    const cert = typeof certs[index] === 'string'
                        ? { name: certs[index], fileUrl: res.data.data.url }
                        : { ...certs[index], fileUrl: res.data.data.url };
                    certs[index] = cert;
                    return { ...prev, certifications: certs };
                });
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(null);
        }
    };

    // Normalize cert: old data might be plain strings
    const normCert = (c) => typeof c === 'string' ? { name: c, fileUrl: null } : c;

    if (loading) {
        return (
            <div className="tp-loading">
                <div className="tp-loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="tp-container">
            {/* Header */}
            <div className="tp-header">
                <div className="tp-header-info">
                    <div className="tp-avatar">
                        {user?.profileImage
                            ? <img src={user.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <User size={32} />
                        }
                    </div>
                    <div>
                        <h1 className="tp-name">{user?.name || 'Trainer'}</h1>
                        <p className="tp-email">{user?.email || ''}</p>
                        <div className="tp-badges">
                            <span className="tp-badge tp-badge-role">
                                Personal Trainer
                            </span>
                            {profile.experienceYears > 0 && (
                                <span className="tp-badge tp-badge-exp">
                                    {profile.experienceYears} years experience
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="tp-header-actions">
                    {!editing ? (
                        <button className="tp-btn tp-btn-edit" onClick={() => setEditing(true)}>
                            <Edit3 size={16} /> Edit Profile
                        </button>
                    ) : (
                        <div className="tp-btn-group">
                            <button className="tp-btn tp-btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                            <button className="tp-btn tp-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : <><Save size={16} /> Save</>}
                            </button>
                        </div>
                    )}
                    {saved && (
                        <span className="tp-saved-msg">
                            <CheckCircle size={14} /> Profile saved!
                        </span>
                    )}
                </div>
            </div>

            <div className="tp-grid">
                {/* Bio */}
                <div className="tp-card tp-card-bio">
                    <div className="tp-card-header">
                        <h2>About Me</h2>
                    </div>
                    {editing ? (
                        <textarea
                            className="tp-textarea"
                            value={profile.bio}
                            onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell your clients about yourself, your training philosophy, and what makes you unique..."
                            rows={5}
                        />
                    ) : (
                        <p className="tp-bio-text">
                            {profile.bio || <span className="tp-placeholder">No bio yet. Click "Edit Profile" to add one.</span>}
                        </p>
                    )}
                </div>

                {/* Contact Info */}
                <div className="tp-card tp-card-contact">
                    <div className="tp-card-header">
                        <h2>Contact & Details</h2>
                    </div>
                    <div className="tp-contact-grid">
                        <div className="tp-contact-item">
                            <label>Phone</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={profile.phone}
                                    onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+30 6900000000"
                                    className="tp-input"
                                />
                            ) : (
                                <span>{profile.phone || '—'}</span>
                            )}
                        </div>
                        <div className="tp-contact-item">
                            <label>Location</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={profile.location}
                                    onChange={e => setProfile(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="Athens, Greece"
                                    className="tp-input"
                                />
                            ) : (
                                <span>{profile.location || '—'}</span>
                            )}
                        </div>
                        <div className="tp-contact-item">
                            <label>Experience</label>
                            {editing ? (
                                <div className="tp-exp-input">
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={profile.experienceYears}
                                        onChange={e => setProfile(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                                        className="tp-input tp-input-small"
                                    />
                                    <span>years</span>
                                </div>
                            ) : (
                                <span>{profile.experienceYears > 0 ? `${profile.experienceYears} years` : '—'}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Specializations */}
                <div className="tp-card tp-card-specs">
                    <div className="tp-card-header">
                        <h2>Specializations</h2>
                    </div>
                    <div className="tp-spec-grid">
                        {SPECIALIZATION_OPTIONS.map(spec => (
                            <button
                                key={spec}
                                className={`tp-spec-chip ${profile.specializations.includes(spec) ? 'tp-spec-active' : ''} ${!editing ? 'tp-spec-readonly' : ''}`}
                                onClick={() => editing && toggleSpecialization(spec)}
                                disabled={!editing}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                    {!editing && profile.specializations.length === 0 && (
                        <p className="tp-placeholder">No specializations selected yet.</p>
                    )}
                </div>

                {/* Certifications */}
                <div className="tp-card tp-card-certs">
                    <div className="tp-card-header">
                        <h2>Certifications & Degrees</h2>
                    </div>
                    <div className="tp-cert-list">
                        {profile.certifications.map((rawCert, i) => {
                            const cert = normCert(rawCert);
                            return (
                                <div key={i} className="tp-cert-item">
                                    <div className="tp-cert-icon" />
                                    <div className="tp-cert-info">
                                        <span className="tp-cert-name">{cert.name}</span>
                                        {cert.fileUrl ? (
                                            <a
                                                href={cert.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="tp-cert-file-link"
                                            >
                                                View Document <ExternalLink size={10} />
                                            </a>
                                        ) : editing ? (
                                            <label className="tp-cert-upload-btn">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    style={{ display: 'none' }}
                                                    onChange={e => handleFileUpload(i, e.target.files[0])}
                                                />
                                                {uploading === i ? (
                                                    <span className="tp-cert-uploading">Uploading...</span>
                                                ) : (
                                                    <><Upload size={12} /> Attach PDF/Image</>
                                                )}
                                            </label>
                                        ) : (
                                            <span className="tp-cert-no-file">No document attached</span>
                                        )}
                                    </div>
                                    {editing && (
                                        <button className="tp-cert-remove" onClick={() => removeCertification(i)}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {profile.certifications.length === 0 && !editing && (
                            <p className="tp-placeholder">No certifications added yet.</p>
                        )}
                    </div>
                    {editing && (
                        <div className="tp-cert-add">
                            <input
                                type="text"
                                value={newCert}
                                onChange={e => setNewCert(e.target.value)}
                                placeholder="e.g. NASM CPT, ACE Certified, BSc Sports Science..."
                                className="tp-input"
                                onKeyDown={e => e.key === 'Enter' && addCertification()}
                            />
                            <button className="tp-btn tp-btn-add" onClick={addCertification}>
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TrainerProfile;
