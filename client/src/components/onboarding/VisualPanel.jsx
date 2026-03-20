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
        <div className="w-full h-full bg-gray-50 flex flex-col justify-center items-center px-12">
            <div className="max-w-md w-full animate-fade-in">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-black mb-4">Why GymLit?</h2>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium">
                        Everything you need to crush your goals, simplified.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="space-y-6">
                    {FEATURES.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={idx}
                                className="group p-6 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-xl cursor-default flex gap-6 items-start border border-transparent hover:border-gray-100"
                            >
                                <div className="w-14 h-14 bg-gray-100 rounded-xl shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    <Icon className="w-7 h-7 text-black" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
                                    <ul className="space-y-2">
                                        {feature.points.map((point, pIdx) => (
                                            <li key={pIdx} className="text-gray-500 font-medium">
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
