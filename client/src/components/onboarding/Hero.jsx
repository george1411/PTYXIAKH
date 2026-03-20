import { ArrowRight } from 'lucide-react';

export default function Hero({ onNext }) {
    return (
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 pt-32 pb-12 animate-fade-in">
            <div className="max-w-xl">

                {/* Headline */}
                <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1] text-white">
                    Train
                    <br />
                    Smarter.
                    <br />
                    <span className="bg-gradient-to-b from-gray-200 to-gray-600 bg-clip-text text-transparent">
                        Stay
                        <br />
                        Connected.
                    </span>
                </h1>

                {/* Subcopy */}
                <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-md">
                    Your personal training, simplified. Join a community that values progress and discipline over perfection.
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-14">
                    <button
                        onClick={onNext}
                        className="group flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-xl shadow-white/5"
                    >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                </div>


            </div>
        </div>
    );
}
