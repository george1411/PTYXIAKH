import { useState } from 'react';
import { Mail, Lock, User, ChevronLeft, Loader2, Dumbbell } from 'lucide-react';
import axios from 'axios';

export default function Signup({ onBack, onSubmit, onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'customer',
        gender: '', height: '', weight: ''
    });

    const isCustomer = formData.role === 'customer';

    const handleStep1 = (e) => {
        e.preventDefault();
        if (isCustomer) {
            setStep(2);
        } else {
            submitForm({});
        }
    };

    const handleStep2 = (e) => {
        e.preventDefault();
        submitForm({ gender: formData.gender, height: formData.height, weight: formData.weight });
    };

    const handleSkip = () => {
        submitForm({});
    };

    const submitForm = async (extra) => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                ...extra
            };
            const response = await axios.post('/api/v1/auth/sign-up', payload);
            if (response.data.success) {
                if (onLoginSuccess) {
                    onLoginSuccess(response.data.data.user);
                } else {
                    onSubmit(formData);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Signup failed');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-8 md:px-16 pt-32 pb-8 animate-slide-up">
            <button
                onClick={step === 2 ? () => setStep(1) : onBack}
                className="self-start mb-8 p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-md w-full mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">
                        {step === 1 ? 'Sign Up' : 'Your Body Stats'}
                    </h2>
                    <div className="w-12 h-1 bg-white rounded-full"></div>
                    {isCustomer && (
                        <div className="flex gap-2 mt-4">
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-white' : 'bg-gray-600'}`} />
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-white' : 'bg-gray-600'}`} />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleStep1} className="space-y-6">
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
                                    placeholder="Email"
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
                                ) : isCustomer ? 'Next →' : 'Sign Up'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleStep2} className="space-y-6">
                        <p className="text-gray-400 text-sm text-center -mt-6 mb-2">
                            Help us personalise your experience
                        </p>

                        {/* Gender */}
                        <div>
                            <label className="block text-gray-400 text-sm font-medium mb-3">Gender</label>
                            <div className="flex gap-3">
                                {['male', 'female'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gender: g })}
                                        className={`flex-1 py-4 rounded-xl font-semibold text-sm capitalize border transition-all ${
                                            formData.gender === g
                                                ? 'bg-white text-black border-white'
                                                : 'bg-black/40 text-gray-400 border-gray-800 hover:border-gray-600'
                                        }`}
                                    >
                                        {g === 'male' ? '♂ Male' : '♀ Female'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Height */}
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">cm</span>
                            <input
                                type="number"
                                min="100"
                                max="250"
                                placeholder="Height (cm)"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                value={formData.height}
                                onChange={e => setFormData({ ...formData, height: e.target.value })}
                            />
                        </div>

                        {/* Weight */}
                        <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">kg</span>
                            <input
                                type="number"
                                min="20"
                                max="300"
                                step="0.1"
                                placeholder="Weight (kg)"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={loading}
                                className="w-full text-gray-500 text-sm hover:text-gray-300 transition-colors py-2"
                            >
                                Skip for now
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
