// ──────────────────────────────────────────────────────────────────
// HANDOFF — drop-in components for Nutrition.jsx (Hero Day redesign)
// Three components replace the current visuals; data flow unchanged.
// All inline styles use existing colors_and_type.css tokens.
// ──────────────────────────────────────────────────────────────────

// ─── 1. HeroDay  — replaces <DailyMacroTracker>  ───────────────────
// Same props/state. Copy your existing goal-edit modal markup
// (everything inside the existing `{editOpen && (…)}` block) and your
// existing `saveGoals` handler into this component unchanged.
const HeroDay = ({ mealsData, balanceData, loading, onGoalsUpdated }) => {
    const totals = mealsData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const [calTarget,     setCalTarget]     = useState(2500);
    const [proteinTarget, setProteinTarget] = useState(150);
    const [carbsTarget,   setCarbsTarget]   = useState(200);
    const [fatTarget,     setFatTarget]     = useState(50);
    const [editOpen, setEditOpen] = useState(false);
    const [draft, setDraft] = useState({ cal: 2500, prot: 150, carbs: 200, fat: 50 });

    React.useEffect(() => {
        if (balanceData) {
            if (balanceData.target)        setCalTarget(balanceData.target);
            if (balanceData.proteinTarget) setProteinTarget(balanceData.proteinTarget);
            if (balanceData.carbsTarget)   setCarbsTarget(balanceData.carbsTarget);
            if (balanceData.fatTarget)     setFatTarget(balanceData.fatTarget);
        }
    }, [balanceData]);

    const openEdit = () => {
        setDraft({ cal: calTarget, prot: proteinTarget, carbs: carbsTarget, fat: fatTarget });
        setEditOpen(true);
    };

    // …saveGoals omitted — copy from existing DailyMacroTracker…

    const remaining = Math.max(0, calTarget - totals.calories);
    const p = Math.min(1, totals.calories / Math.max(1, calTarget));
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
    });

    // ring geometry
    const R = 110, STROKE = 14, CX = 130, CY = 130;
    const CIRC = 2 * Math.PI * R;

    const macros = [
        { label: 'Calories', cur: totals.calories, max: calTarget,     color: '#e0e0e0', unit: 'kcal' },
        { label: 'Protein',  cur: totals.protein,  max: proteinTarget, color: '#a5b4fc', unit: 'g' },
        { label: 'Carbs',    cur: totals.carbs,    max: carbsTarget,   color: '#38bdf8', unit: 'g' },
        { label: 'Fat',      cur: totals.fat,      max: fatTarget,     color: '#c4b5fd', unit: 'g' },
    ];

    return (
        <div className="nutrition-card" style={{ padding: '24px 28px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span className="nutrition-section-label" style={{ color: '#a5b4fc' }}>
                    {today.toUpperCase()}
                </span>
                <button onClick={openEdit} title="Edit nutrition goals"
                    style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
                    <Edit3 size={11} />
                </button>
            </div>

            {/* Hero row — ring + headline */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'center', marginBottom: 22 }}>
                {/* big remaining-kcal ring */}
                <div style={{ position: 'relative', width: 260, height: 260, flexShrink: 0 }}>
                    <svg width="260" height="260" viewBox="0 0 260 260">
                        <circle cx={CX} cy={CY} r={R}
                            stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} fill="none" />
                        <circle cx={CX} cy={CY} r={R}
                            stroke="#818CF8" strokeWidth={STROKE} fill="none"
                            strokeDasharray={CIRC}
                            strokeDashoffset={CIRC * (1 - p)}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${CX} ${CY})`}
                            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.2em', color: '#a5b4fc' }}>
                            REMAINING
                        </div>
                        <div style={{
                            fontSize: 60, fontWeight: 800, letterSpacing: '-0.035em',
                            color: '#f0f0f0', marginTop: 6, lineHeight: 1,
                            fontVariantNumeric: 'tabular-nums',
                        }}>
                            {loading ? '—' : remaining.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.06em', marginTop: 4 }}>
                            kcal
                        </div>
                    </div>
                </div>

                {/* headline + sub */}
                <div>
                    <h1 style={{
                        margin: 0, fontSize: 30, fontWeight: 800,
                        letterSpacing: '-0.025em', lineHeight: 1.1, color: '#f0f0f0',
                    }}>
                        You have <span style={{ color: '#a5b4fc' }}>{remaining.toLocaleString()} kcal</span> left.
                    </h1>
                    <div style={{ fontSize: 14, color: '#888', fontWeight: 500, marginTop: 8, maxWidth: 460 }}>
                        That's about one solid meal. You're{' '}
                        <span style={{ color: '#f0f0f0', fontWeight: 700 }}>
                            {Math.round(p * 100)}%
                        </span>{' '}
                        of the way to {calTarget.toLocaleString()} kcal.
                    </div>
                </div>
            </div>

            {/* Macro strip — horizontal bars per macro */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {macros.map(m => {
                    const mp = Math.min(1, m.cur / Math.max(1, m.max));
                    return (
                        <div key={m.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                <span style={{
                                    fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em',
                                    color: '#888', textTransform: 'uppercase',
                                }}>{m.label}</span>
                                <span style={{
                                    fontSize: 11.5, fontWeight: 700, color: '#888',
                                    fontVariantNumeric: 'tabular-nums',
                                }}>
                                    <span style={{ color: '#f0f0f0' }}>
                                        {m.cur < 10 ? m.cur.toFixed(1) : Math.round(m.cur)}
                                    </span>
                                    <span style={{ color: '#555' }}> / {m.max} {m.unit}</span>
                                </span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${mp * 100}%`, height: '100%',
                                    background: m.color, borderRadius: 999,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* {editOpen && ( …copy existing goal-edit modal here unchanged… )} */}
        </div>
    );
};


// ─── 2. MealsTimeline  — replaces MealLogger's render output ───────
// Drop this in place of MealLogger's existing returned JSX (everything
// after `const grouped = mealsData?.meals || …`). Renders meals as a
// single vertical column, one card per meal type, with timestamps.
//
// Keep all your existing handlers (openModal, handleDelete) and the
// modal markup. Just swap how `grouped` renders.

const MEAL_TIMES = { breakfast: '08:30', lunch: '13:00', snack: '16:00', dinner: '19:30' };

// Tip: tweak `openModal` to pre-fill the type:
//   const openModal = (type) => {
//       setForm({ ...EMPTY_FORM, mealType: type ?? EMPTY_FORM.mealType });
//       …existing body unchanged…
//   };

const MealsTimelineRow = ({ type, items, openModal, handleDelete }) => {
    const isEmpty = items.length === 0;
    const totalCal = items.reduce((s, m) => s + (m.calories || 0), 0);
    return (
        <div style={{
            background: isEmpty ? 'transparent' : '#0a0a0a',
            border: `1px ${isEmpty ? 'dashed' : 'solid'} ${isEmpty ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 12,
            padding: '14px 16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: isEmpty ? '#888' : '#f0f0f0',
                    }}>{MEAL_LABELS[type]}</span>
                    {isEmpty ? (
                        <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                            padding: '2px 6px', borderRadius: 4,
                            background: 'rgba(129,140,248,0.10)', color: '#a5b4fc',
                            textTransform: 'uppercase',
                        }}>Planned</span>
                    ) : (
                        <span style={{
                            fontSize: 11, fontWeight: 600, color: '#555',
                            fontVariantNumeric: 'tabular-nums',
                        }}>{MEAL_TIMES[type]}</span>
                    )}
                </div>
                <span style={{
                    fontSize: 13, fontWeight: 800,
                    color: isEmpty ? '#888' : '#f0f0f0',
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {Math.round(totalCal)}
                    <span style={{ fontSize: 10, color: '#555', marginLeft: 2 }}>kcal</span>
                </span>
            </div>

            {isEmpty ? (
                <button onClick={() => openModal(type)}
                    style={{
                        width: '100%',
                        padding: '8px 0',
                        background: 'transparent',
                        border: '1px dashed rgba(129,140,248,0.25)',
                        borderRadius: 8,
                        color: '#a5b4fc',
                        fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        cursor: 'pointer', letterSpacing: '0.04em',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    <Plus size={10} />
                    Log this meal
                </button>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {items.map(meal => (
                        <div key={meal.id} style={{
                            display: 'inline-flex', alignItems: 'baseline', gap: 6,
                            padding: '5px 10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 999,
                            fontSize: 11.5,
                        }}>
                            <span style={{ fontWeight: 700, color: '#f0f0f0' }}>{meal.foodName}</span>
                            <span style={{ color: '#555', fontWeight: 600 }}>
                                {meal.amount}{meal.unit}
                            </span>
                            <span style={{
                                color: '#a5b4fc', fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                            }}>{Math.round(meal.calories || 0)}</span>
                            <button onClick={() => handleDelete(meal.id)}
                                style={{
                                    background: 'transparent', border: 0,
                                    padding: 0, marginLeft: 2,
                                    color: '#555', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                }}>
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Inside MealLogger's return, after `const grouped = mealsData?.meals || …`,
// render this in place of the existing nutrition-card markup:
//
//   <div className="nutrition-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '18px 18px 16px' }}>
//       <div className="nutrition-card-header">
//           <span className="nutrition-section-label">TODAY'S MEALS</span>
//           <button className="meal-add-btn" onClick={() => openModal()}>
//               <Plus size={14} /> Add meal
//           </button>
//       </div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//           {MEAL_TYPES.map(type => (
//               <MealsTimelineRow
//                   key={type}
//                   type={type}
//                   items={grouped[type] || []}
//                   openModal={openModal}
//                   handleDelete={handleDelete}
//               />
//           ))}
//       </div>
//       {showModal && ( …existing modal markup unchanged… )}
//   </div>


// ─── 3. WaterCluster  — replaces WaterIntakeTracker ────────────────
// Same data/handlers (axios POST /api/v1/dailylogs/water, glasses, saving).
// Single big counter + cup row + one button — no duplicate progress bar.
const WaterCluster = () => {
    const [glasses, setGlasses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const goal = 8;

    React.useEffect(() => {
        axios.get('/api/v1/dailylogs/today', { withCredentials: true })
            .then(res => setGlasses(res.data.data?.waterIntake || 0))
            .catch(err => console.error('Water intake error:', err))
            .finally(() => setLoading(false));
    }, []);

    const update = async (newVal) => {
        if (saving || newVal < 0 || newVal > goal) return;
        setSaving(true);
        try {
            await axios.post('/api/v1/dailylogs/water', { glasses: newVal }, { withCredentials: true });
            setGlasses(newVal);
        } catch (err) {
            console.error('Water update error:', err);
        } finally { setSaving(false); }
    };

    return (
        <div className="nutrition-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="nutrition-section-label">WATER</span>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: '#888',
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    <span style={{ color: '#38bdf8' }}>{glasses}</span>
                    <span style={{ color: '#555' }}> / {goal}</span>
                </span>
            </div>
            {/* clickable glass icons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: goal }).map((_, i) => {
                    const filled = i < glasses;
                    return (
                        <button key={i} onClick={() => update(i + 1)} disabled={saving}
                            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                            <svg width="26" height="32" viewBox="0 0 26 32">
                                <defs>
                                    <clipPath id={`wg-${i}`}>
                                        <path d="M 5 2 L 21 2 L 19 30 L 7 30 Z" />
                                    </clipPath>
                                </defs>
                                <path d="M 5 2 L 21 2 L 19 30 L 7 30 Z"
                                    fill="rgba(255,255,255,0.03)"
                                    stroke={filled ? '#38bdf8' : 'rgba(255,255,255,0.18)'}
                                    strokeWidth="1.5"
                                    strokeLinejoin="round" />
                                {filled && (
                                    <rect x="0" y="2" width="26" height="28"
                                        fill="#38bdf8" opacity="0.85"
                                        clipPath={`url(#wg-${i})`} />
                                )}
                            </svg>
                        </button>
                    );
                })}
            </div>
            <button disabled={saving || glasses >= goal} onClick={() => update(glasses + 1)}
                style={{
                    marginTop: 'auto',
                    padding: '8px 0',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    color: '#38bdf8',
                    fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit',
                    cursor: glasses >= goal ? 'not-allowed' : 'pointer',
                    opacity: glasses >= goal ? 0.5 : 1, letterSpacing: '0.04em',
                }}>+ Add glass</button>
        </div>
    );
};

// Then in main <Nutrition> page, swap <WaterIntakeTracker /> for <WaterCluster />.
