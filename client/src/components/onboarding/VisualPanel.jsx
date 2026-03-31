import { Dumbbell, MessageCircle, BarChart3 } from 'lucide-react';

const FEATURES = [
    {
        icon: Dumbbell,
        title: "Smarter Training",
        points: ["Structured workouts", "Clear goals", "Track progress easily"]
    },
    {
        icon: MessageCircle,
        title: "Stay Connected",
        points: ["Direct trainer messaging", "Fast feedback", "No missed updates"]
    },
    {
        icon: BarChart3,
        title: "All in One Place",
        points: ["Workouts & Messages", "One simple app"]
    }
];

export default function VisualPanel() {
    return (
        <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <div className="animate-fade-in" style={{ width: '360px' }}>

                {/* Header */}
                <div className="mb-10" style={{ marginLeft: '50px' }}>
                    <h2 className="text-4xl font-bold mb-3" style={{ color: '#818CF8' }}>
                        Why GymLit
                    </h2>
                    <p className="text-xl font-semibold" style={{ color: '#f0f0f0' }}>
                        Everything in one place.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="flex flex-col gap-3">
                    {FEATURES.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={idx}
                                className="p-5 rounded-2xl flex gap-5 items-start cursor-default transition-all duration-200"
                                style={{
                                    background: '#1a1a1a',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = '#222222';
                                    e.currentTarget.style.borderColor = 'rgba(165,180,252,0.25)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = '#1a1a1a';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(165,180,252,0.1)', border: '1px solid rgba(165,180,252,0.2)' }}
                                >
                                    <Icon className="w-6 h-6" style={{ color: '#a5b4fc' }} />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-2" style={{ fontSize: '0.95rem', color: '#f0f0f0' }}>{feature.title}</h3>
                                    <ul className="flex flex-col gap-1">
                                        {feature.points.map((point, pIdx) => (
                                            <li key={pIdx} className="flex items-center gap-2" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)' }}>
                                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#a5b4fc', opacity: 0.5, flexShrink: 0, display: 'inline-block' }} />
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}
