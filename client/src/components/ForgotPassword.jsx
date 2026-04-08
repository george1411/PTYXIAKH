import { useState } from 'react';
import axios from 'axios';
import { Mail, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';

export default function ForgotPassword({ onBack, onCodeSent }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/api/v1/auth/forgot-password', { email });
            if (response.data.success) {
                setSuccess('A reset code has been sent to your email.');
                setTimeout(() => onCodeSent(email), 1500);
            }
        } catch (err) {
            const status = err.response?.status;
            if (status === 404) {
                setError('No account found with this email.');
            } else {
                setError(err.response?.data?.message || 'Something went wrong. Please try again.');
            }
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
                    <h2 className="text-4xl font-bold mb-2 tracking-tight text-white">Reset Password</h2>
                    <div className="w-12 h-1 bg-white rounded-full"></div>
                </div>

                <p className="text-gray-400 text-center mb-8">
                    Enter your email address and we'll send you a code to reset your password.
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
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Email address"
                                className="w-full bg-black/40 border border-gray-800 rounded-xl p-5 pl-14 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:bg-black transition-all font-medium"
                            />
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
                                    "Send Reset Code"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
