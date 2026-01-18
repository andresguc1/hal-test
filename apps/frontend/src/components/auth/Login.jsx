import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/useToast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(email, password);
            toast.success('Welcome back to HAL-TEST!');
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#0F0F10] text-slate-100 p-4">
            <div className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-slate-800 bg-[#141415]/80 backdrop-blur-xl shadow-2xl">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <LogIn className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">HAL-TEST</h1>
                    <p className="text-slate-400">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="pl-10 bg-slate-900/50 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-10 bg-slate-900/50 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20 h-11"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all transform active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-slate-500">Don't have an account? </span>
                    <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        Create one now
                    </Link>
                </div>
            </div>
        </div>
    );
}
