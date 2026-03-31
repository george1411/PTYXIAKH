import { ArrowRight } from 'lucide-react';

export default function Hero({ onNext }) {
    return (
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 pb-12 animate-fade-in">
            <div className="max-w-xl">

                {/* Headline */}
                <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]" style={{ color: '#f0f0f0' }}>
                    Train
                    <br />
                    Smarter.
                    <br />
                    <span style={{
                        background: 'linear-gradient(180deg, #a5b4fc 0%, #6d6aff 40%, rgba(30,20,80,0.3) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Stay
                        <br />
                        Connected.
                    </span>
                </h1>

                {/* Subcopy */}
                <p className="text-lg mb-10 leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Your personal training, simplified. Join a community that values progress and discipline over perfection.
                </p>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={onNext}
                        className="group flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105"
                        style={{ background: '#a5b4fc', color: '#0a0a0a' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#c4b5fd'}
                        onMouseLeave={e => e.currentTarget.style.background = '#a5b4fc'}
                    >
                        Get Started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
    );
}
