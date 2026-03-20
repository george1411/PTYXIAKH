import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Check, ChevronLeft, Loader2, Dumbbell } from 'lucide-react';
import axios from 'axios';

export default function Signup({ onBack, onSubmit, onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/v1/auth/sign-up', formData);
            if (response.data.success) {
                // If the backend returns the user object, pass it up
                // The parent component (App.jsx) should handle setting the user state
                if (onLoginSuccess) {
                    onLoginSuccess(response.data.data.user);
                } else {
                    onSubmit(formData); // Fallback if onLoginSuccess not passed, though we should update App.jsx too
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-8 md:px-16 pt-32 pb-8 animate-slide-up">
            <button
                onClick={onBack}
                className="self-start mb-8 p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-md w-full mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">Sign Up</h2>
                    <div className="w-12 h-1 bg-white rounded-full"></div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="relative group">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                required
                                placeholder="Name"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                required
                                placeholder="Email id"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <Dumbbell className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <select
                                required
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium appearance-none cursor-pointer"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="customer" className="bg-black text-white">Member</option>
                                <option value="personal_trainer" className="bg-black text-white">Personal Trainer</option>
                            </select>
                            {/* Custom arrow for select if needed, but appearance-none removes default */}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
