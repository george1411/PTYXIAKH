import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, X } from 'lucide-react';
import './FindTrainer.css';

// ─── Trainer Card ─────────────────────────────────────────────
const TrainerCard = ({ trainer, onViewDetails }) => {
    const initials = trainer.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const specs = trainer.specializations?.slice(0, 3) || [];

    return (
        <div className="ft-card">
            <div className="ft-card-top">
                <div className="ft-avatar">{initials}</div>
                <div className="ft-card-info">
                    <h3 className="ft-name">{trainer.name}</h3>
                    <div className="ft-meta-row">
                        {trainer.location && (
                            <span className="ft-meta">{trainer.location}</span>
                        )}
                        {trainer.experienceYears > 0 && (
                            <span className="ft-meta">{trainer.experienceYears} yrs exp</span>
                        )}
                        <span className="ft-meta">{trainer.clientCount} clients</span>
                    </div>
                </div>
            </div>

            <div className="ft-card-middle">
                {specs.length > 0 && (
                    <div className="ft-specs">
                        {specs.map((s, i) => <span key={i} className="ft-spec-chip">{s}</span>)}
                        {trainer.specializations?.length > 3 && (
                            <span className="ft-spec-chip ft-spec-more">+{trainer.specializations.length - 3}</span>
                        )}
                    </div>
                )}
                {trainer.bio && (
                    <p className="ft-bio-preview">{trainer.bio.slice(0, 80)}{trainer.bio.length > 80 ? '…' : ''}</p>
                )}
            </div>

            <button className="ft-btn-view" onClick={() => onViewDetails(trainer.id)}>
                View Full Profile
            </button>
        </div>
    );
};

// ─── Trainer Detail Modal ─────────────────────────────────────
const TrainerModal = ({ trainerId, onClose, onMessage }) => {
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/v1/trainer/${trainerId}/public`, { withCredentials: true })
            .then(r => setTrainer(r.data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [trainerId]);

    const initials = trainer?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="ft-modal-overlay" onClick={onClose}>
            <div className="ft-modal" onClick={e => e.stopPropagation()}>
                <button className="ft-modal-close" onClick={onClose}><X size={18} /></button>

                {loading ? (
                    <div className="ft-modal-loading">Loading…</div>
                ) : !trainer ? (
                    <div className="ft-modal-loading">Trainer not found.</div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="ft-modal-header">
                            <div className="ft-modal-avatar">{initials}</div>
                            <div>
                                <h2 className="ft-modal-name">{trainer.name}</h2>
                                <p className="ft-modal-email">{trainer.email}</p>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="ft-modal-stats">
                            <div className="ft-modal-stat">
                                <span className="ft-modal-stat-val">{trainer.experienceYears || 0}</span>
                                <span className="ft-modal-stat-label">Years Exp.</span>
                            </div>
                            <div className="ft-modal-stat">
                                <span className="ft-modal-stat-val">{trainer.clientCount}</span>
                                <span className="ft-modal-stat-label">Clients</span>
                            </div>
                            <div className="ft-modal-stat">
                                <span className="ft-modal-stat-val">{trainer.certifications?.length || 0}</span>
                                <span className="ft-modal-stat-label">Certs</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {trainer.bio && (
                            <div className="ft-modal-section">
                                <h4 className="ft-modal-section-title">About</h4>
                                <p className="ft-modal-bio">{trainer.bio}</p>
                            </div>
                        )}

                        {/* Specializations */}
                        {trainer.specializations?.length > 0 && (
                            <div className="ft-modal-section">
                                <h4 className="ft-modal-section-title">Specializations</h4>
                                <div className="ft-modal-chips">
                                    {trainer.specializations.map((s, i) => (
                                        <span key={i} className="ft-modal-chip spec">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certifications */}
                        {trainer.certifications?.length > 0 && (
                            <div className="ft-modal-section">
                                <h4 className="ft-modal-section-title">Certifications</h4>
                                <div className="ft-modal-chips">
                                    {trainer.certifications.map((c, i) => {
                                        const name = typeof c === 'object' ? c.name : c;
                                        const url  = typeof c === 'object' ? c.fileUrl : null;
                                        return url ? (
                                            <a
                                                key={i}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ft-modal-chip cert ft-modal-chip-link"
                                            >{name}</a>
                                        ) : (
                                            <span key={i} className="ft-modal-chip cert">{name}</span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Contact */}
                        <div className="ft-modal-section">
                            <h4 className="ft-modal-section-title">Contact & Location</h4>
                            <div className="ft-modal-contact">
                                {trainer.location && (
                                    <span className="ft-modal-contact-item">{trainer.location}</span>
                                )}
                                {trainer.phone && (
                                    <span className="ft-modal-contact-item">{trainer.phone}</span>
                                )}
                                <span className="ft-modal-contact-item">{trainer.email}</span>
                            </div>
                        </div>

                        {/* Message button */}
                        <button
                            className="ft-modal-msg-btn"
                            onClick={() => onMessage(trainer.id, trainer.name)}
                        >
                            Message {trainer.name}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const PAGE_SIZE = 10;

// ─── Main Component ───────────────────────────────────────────
const FindTrainer = ({ onMessage }) => {
    const [trainers, setTrainers]       = useState([]);
    const [filtered, setFiltered]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [selectedId, setSelectedId]   = useState(null);
    const [page, setPage]               = useState(1);

    useEffect(() => {
        axios.get('/api/v1/trainer/list', { withCredentials: true })
            .then(r => { setTrainers(r.data.data); setFiltered(r.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Reset to page 1 when search changes
    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            trainers.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.location?.toLowerCase().includes(q) ||
                t.specializations?.some(s => s.toLowerCase().includes(q))
            )
        );
        setPage(1);
    }, [search, trainers]);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Build compact page number list: always show first, last, current ±1
    const pageNumbers = () => {
        const pages = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
        const sorted = [...pages].sort((a, b) => a - b);
        const result = [];
        sorted.forEach((p, i) => {
            if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
            result.push(p);
        });
        return result;
    };

    return (
        <div className="ft-container">
            {/* Header */}
            <div className="ft-header">
                <div>
                    <h1 className="ft-title">Find a Trainer</h1>
                    <p className="ft-subtitle">
                        {filtered.length} trainer{filtered.length !== 1 ? 's' : ''}
                        {search ? ` matching "${search}"` : ' available'}
                    </p>
                </div>
                <div className="ft-search-wrap">
                    <Search size={16} className="ft-search-icon" />
                    <input
                        className="ft-search-input"
                        placeholder="Search by name, location, specialization…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="ft-empty">Loading trainers…</div>
            ) : filtered.length === 0 ? (
                <div className="ft-empty">No trainers found{search ? ` for "${search}"` : ''}.</div>
            ) : (
                <>
                    <div className="ft-list">
                        {paginated.map(t => (
                            <TrainerCard key={t.id} trainer={t} onViewDetails={setSelectedId} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="ft-pagination">
                            <button
                                className="ft-page-btn ft-page-arrow"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >‹</button>

                            {pageNumbers().map((p, i) =>
                                p === '…' ? (
                                    <span key={`ellipsis-${i}`} className="ft-page-ellipsis">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`ft-page-btn ${page === p ? 'active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >{p}</button>
                                )
                            )}

                            <button
                                className="ft-page-btn ft-page-arrow"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >›</button>
                        </div>
                    )}
                </>
            )}

            {/* Detail modal */}
            {selectedId && (
                <TrainerModal
                    trainerId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onMessage={(id, name) => { setSelectedId(null); onMessage(id, name); }}
                />
            )}
        </div>
    );
};

export default FindTrainer;
