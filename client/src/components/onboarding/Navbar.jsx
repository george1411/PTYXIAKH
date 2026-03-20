import { Zap } from 'lucide-react';
import logo from '../../assets/logo.png'; // Adjusted path based on component location

export default function Navbar({ onLogin }) {
    return (
        <nav className="absolute top-0 left-0 w-full z-50 p-6 md:p-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <img src={logo} alt="GymLit Logo" className="w-10 h-10 object-contain" />
                <span className="font-bold text-2xl tracking-tight text-white">GymLit</span>
            </div>

            <div className="text-sm font-medium text-gray-400">
                Already have an account? <button onClick={onLogin} className="text-white underline decoration-white underline-offset-4 font-semibold hover:text-gray-300 transition-colors ml-1">Log in</button>
            </div>
        </nav>
    );
}
