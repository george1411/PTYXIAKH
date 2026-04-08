import { useState, useRef } from 'react';
import axios from 'axios';
import { Lock, Loader2, ChevronLeft } from 'lucide-react';

export default function ResetPassword({ email, onBack, onSuccess }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleCodeChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('/api/v1/auth/reset-password', {
                email,
                code: fullCode,
                newPassword
            });
            if (response.data.success) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => onSuccess(), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col px-8 md:px-16 pt-8 pb-8 animate-slide-up">
            <button
                onClick={onBack}
                className="self-start mb-8 p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-md w-full mx-auto">
                <div className="flex flex-col items-center mb-10">
                    <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">New Password</h2>
                    <div className="w-12 h-1 bg-white rounded-full"></div>
                </div>

                <p className="text-gray-400 text-center mb-8">
                    Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span>
                </p>

                <div className="bg-transparent">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 6-digit code input */}
                        <div className="flex justify-center gap-3" onPaste={handlePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (inputRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-xl font-bold bg-black/40 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-white focus:bg-black transition-all"
                                />
                            ))}
                        </div>

                        <div className="space-y-5">
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="New password"
                                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm new password"
                                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "Reset Password"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
