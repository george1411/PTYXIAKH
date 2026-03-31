export default function VisualPanel() {
    return (
        <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div className="animate-fade-in" style={{ position: 'relative', width: '420px', height: '480px' }}>

                {/* Glow */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Card 1 — Workout */}
                <div style={{
                    position: 'absolute', top: '0px', left: '30px',
                    width: '230px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: '#a5b4fc', marginBottom: '2px' }}>MONDAY</p>
                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#f0f0f0', marginBottom: '14px' }}>CHEST DAY</p>

                    {/* Exercise */}
                    <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '6px' }}>Bench Press</p>
                        {[{ label: 'Set 1', val: '60kg × 8' }, { label: 'Set 2', val: '60kg × 8' }].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: '8px', padding: '5px 10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                                <span style={{ fontSize: '0.7rem', color: '#f0f0f0', fontWeight: 600 }}>{s.val}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '6px' }}>Incline Dumbbell</p>
                        {[{ label: 'Set 1', val: '20kg × 10' }].map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#1a1a1a', borderRadius: '8px', padding: '5px 10px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                                <span style={{ fontSize: '0.7rem', color: '#f0f0f0', fontWeight: 600 }}>{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 2 — Macro Tracker */}
                <div style={{
                    position: 'absolute', top: '40px', right: '0px',
                    width: '175px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '2px' }}>Daily Macros</p>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Today's progress</p>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        {[
                            { label: 'Calories', val: '1840', max: '2500', color: '#818CF8' },
                            { label: 'Protein', val: '112', max: '150', color: '#a5b4fc' },
                        ].map((m, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <svg width="44" height="44" viewBox="0 0 44 44">
                                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                    <circle cx="22" cy="22" r="18" fill="none" stroke={m.color} strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 18 * (parseInt(m.val) / parseInt(m.max))} ${2 * Math.PI * 18}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 22 22)" />
                                    <text x="22" y="26" textAnchor="middle" fill="#f0f0f0" fontSize="8" fontWeight="700">{Math.round(parseInt(m.val) / parseInt(m.max) * 100)}%</text>
                                </svg>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3 — Weight History */}
                <div style={{
                    position: 'absolute', bottom: '0px', left: '10px',
                    width: '260px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0f0f0' }}>Weight History</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['1M', '3M', '1Y'].map((t, i) => (
                                <span key={i} style={{
                                    fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px',
                                    background: i === 1 ? '#818CF8' : 'transparent',
                                    color: i === 1 ? '#fff' : 'rgba(255,255,255,0.35)',
                                    fontWeight: 600
                                }}>{t}</span>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f0f0f0' }}>78</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>kg</span>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 7px', borderRadius: '20px', fontWeight: 700 }}>-2.0 kg</span>
                    </div>
                    {/* Mini line chart */}
                    <svg width="100%" height="48" viewBox="0 0 228 48" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0,38 L38,34 L76,30 L114,26 L152,20 L190,16 L228,10" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M0,38 L38,34 L76,30 L114,26 L152,20 L190,16 L228,10 L228,48 L0,48 Z" fill="url(#wg)" />
                        {[0, 38, 76, 114, 152, 190, 228].map((x, i) => {
                            const ys = [38, 34, 30, 26, 20, 16, 10];
                            return <circle key={i} cx={x} cy={ys[i]} r="3" fill="#818CF8" />;
                        })}
                    </svg>
                </div>

                {/* Card 4 — Message bubble */}
                <div style={{
                    position: 'absolute', bottom: '60px', right: '0px',
                    width: '155px',
                    background: '#111111',
                    border: '1px solid rgba(165,180,252,0.2)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                    <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '4px' }}>Coach Alex</p>
                    <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Great session today! Increase bench to 65kg next week.</p>
                    <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', marginTop: '6px', textAlign: 'right' }}>2 min ago</p>
                </div>

            </div>
        </div>
    );
}
