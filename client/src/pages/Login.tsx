import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { usePageTitle } from '../lib/usePageTitle';
import { LogIn } from 'lucide-react';

export default function Login() {
  usePageTitle('Sign In');
  const [email, setEmail] = useState('demo@closepilot.ai');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="glass p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-lg font-bold">CP</div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to your ClosePilot account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <button type="submit" disabled={loading} className="btn-brand w-full flex items-center justify-center gap-2">
            <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          Don't have an account? <Link to="/register" className="text-brand-400 hover:underline">Sign Up</Link>
        </p>
        <p className="text-center text-white/30 text-xs mt-3">Demo: demo@closepilot.ai / demo123</p>
      </div>
    </div>
  );
}
