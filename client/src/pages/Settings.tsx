import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { User, Building, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [firm, setFirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setFirm((user as any).firm || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/transactions/settings', { name, firm });
      success('Settings saved successfully');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="glass p-6 space-y-6">
        <h2 className="font-semibold text-lg flex items-center gap-2"><User size={20} /> Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/40 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-400 transition" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5 flex items-center gap-1.5"><Building size={14} /> Firm / Brokerage</label>
            <input value={firm} onChange={e => setFirm(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-400 transition"
              placeholder="Your brokerage name" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="btn-brand flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
