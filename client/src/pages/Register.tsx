import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', firm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="glass p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-lg font-bold">CP</div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-white/50 text-sm mt-1">Start coordinating transactions with AI</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-white/60 mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Firm / Brokerage <span className="text-white/30">(optional)</span></label>
            <input type="text" value={form.firm} onChange={set('firm')}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-400 transition" />
          </div>
          <button type="submit" disabled={loading} className="btn-brand w-full flex items-center justify-center gap-2">
            <UserPlus size={18} /> {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-brand-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
