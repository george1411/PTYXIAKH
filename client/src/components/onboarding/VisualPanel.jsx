export default function VisualPanel() {
    return (
        <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div className="animate-fade-in" style={{ position: 'relative', width: '500px', height: '520px' }}>

                {/* Subtle glow */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Card 1 — Weight History (bottom-left) */}
                <div style={{
                    position: 'absolute', bottom: '20px', left: '0px',
                    width: '260px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    transform: 'rotate(-3deg)',
                    zIndex: 1,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f0f0' }}>Weight History</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['1M', '3M', '1Y'].map((t, i) => (
                                <span key={i} style={{
                                    fontSize: '0.62rem', padding: '3px 7px', borderRadius: '6px',
                                    background: i === 1 ? '#818CF8' : 'transparent',
                                    color: i === 1 ? '#fff' : 'rgba(255,255,255,0.35)',
                                    fontWeight: 600
                                }}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f0f0f0' }}>65</span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>kg</span>
                        <span style={{ fontSize: '0.68rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>-1.0 kg</span>
                    </div>
                    <svg width="100%" height="56" viewBox="0 0 220 56" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,42 L44,36 L88,38 L132,28 L176,34 L220,20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                        <path d="M0,42 L44,36 L88,38 L132,28 L176,34 L220,20" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M0,42 L44,36 L88,38 L132,28 L176,34 L220,20 L220,56 L0,56 Z" fill="url(#wg)" />
                        {[[0,42],[44,36],[88,38],[132,28],[176,34],[220,20]].map(([x,y], i) => (
                            <circle key={i} cx={x} cy={y} r="3.5" fill="#0a0a0a" stroke="#818CF8" strokeWidth="2" />
                        ))}
                    </svg>
                </div>

                {/* Card 2 — Workout (center) */}
                <div style={{
                    position: 'absolute', top: '80px', left: '90px',
                    width: '270px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                    transform: 'rotate(-1.5deg)',
                    zIndex: 2,
                }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#a5b4fc', marginBottom: '3px' }}>MONDAY</p>
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0f0', marginBottom: '18px' }}>CHEST DAY</p>

                    <div style={{ marginBottom: '14px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '8px' }}>Bench Press</p>
                        {[{ label: 'Set 1', val: '60kg × 8' }, { label: 'Set 2', val: '60kg × 8' }].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: '10px', padding: '7px 12px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                                <span style={{ fontSize: '0.72rem', color: '#f0f0f0', fontWeight: 600 }}>{s.val}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '8px' }}>Cable Fly</p>
                        {[{ label: 'Set 1', val: '15kg × 12' }, { label: 'Set 2', val: '15kg × 12' }].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: '10px', padding: '7px 12px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                                <span style={{ fontSize: '0.72rem', color: '#f0f0f0', fontWeight: 600 }}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3 — Daily Macro Tracker (top-right, partially cropped) */}
                <div style={{
                    position: 'absolute', top: '0px', right: '-30px',
                    width: '280px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    transform: 'rotate(1deg)',
                    zIndex: 3,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '2px' }}>Daily Macro Tracker</p>
                            <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>Today's progress vs targets</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        {[
                            { label: 'Calories', val: 1840, max: 2500, color: '#818CF8' },
                            { label: 'Protein',  val: 112,  max: 150,  color: '#a5b4fc' },
                            { label: 'Fat',      val: 52,   max: 70,   color: '#c4b5fd' },
                        ].map((m, i) => {
                            const pct = m.val / m.max;
                            const r = 22;
                            const circ = 2 * Math.PI * r;
                            return (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <svg width="56" height="56" viewBox="0 0 56 56">
                                        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                                        <circle cx="28" cy="28" r={r} fill="none" stroke={m.color} strokeWidth="5"
                                            strokeDasharray={`${circ * pct} ${circ}`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 28 28)" />
                                        <text x="28" y="32" textAnchor="middle" fill="#f0f0f0" fontSize="9" fontWeight="700">{Math.round(pct * 100)}%</text>
                                    </svg>
                                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>{m.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
