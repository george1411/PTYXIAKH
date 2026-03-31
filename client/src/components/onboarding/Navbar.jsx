export default function Navbar({ onLogin }) {
    return (
        <nav className="w-full z-50 px-8 md:px-16 py-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <span className="font-bold text-2xl tracking-tight" style={{ color: '#f0f0f0' }}>Gym<span style={{ color: '#818CF8' }}>Lit</span></span>
            </div>

            <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Already have an account?{' '}
                <button
                    onClick={onLogin}
                    className="underline underline-offset-4 font-semibold transition-colors ml-1"
                    style={{ color: '#a5b4fc' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                    onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}
                >
                    Log in
                </button>
            </div>
        </nav>
    );
}
