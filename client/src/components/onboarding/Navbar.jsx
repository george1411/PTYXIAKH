export default function Navbar({ onLogin }) {
    return (
        <nav className="absolute top-0 left-0 w-full z-50 p-6 md:p-10 flex justify-between items-center">
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
