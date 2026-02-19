import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { User, Building, Phone, Award, FileText, Upload, PartyPopper, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = ['Profile', 'First Transaction', 'All Set!'];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name: user?.name || '', firm: user?.firm || '', phone: '', license_number: '' });
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
    } catch { /* ignore */ }
    setSaving(false);
    setStep(1);
  };

  const handleComplete = async () => {
    setShowConfetti(true);
    try {
      await api.post('/auth/onboarding-complete');
    } catch { /* ignore */ }
  };

  const goToDashboard = () => navigate('/dashboard');
  const goToUpload = () => navigate('/upload');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      {showConfetti && <Confetti />}
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-accent-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/30'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-accent-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Profile */}
        {step === 0 && (
          <div className="glass rounded-2xl p-8 animate-slide-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                <User size={28} className="text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome! Let's set up your profile</h2>
              <p className="text-white/40">Tell us a bit about yourself so we can personalize your experience.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-1 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 transition-colors" placeholder="Jane Smith" />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Firm / Brokerage</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={profile.firm} onChange={e => setProfile({ ...profile, firm: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 transition-colors" placeholder="Keller Williams" />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 transition-colors" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">License Number</label>
                <div className="relative">
                  <Award size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={profile.license_number} onChange={e => setProfile({ ...profile, license_number: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-brand-400 transition-colors" placeholder="RE-123456" />
                </div>
              </div>
            </div>
            <button onClick={handleProfileSave} disabled={saving || !profile.name}
              className="btn-brand w-full mt-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? 'Saving...' : <>Continue <ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* Step 1: First Transaction */}
        {step === 1 && (
          <div className="glass rounded-2xl p-8 animate-slide-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Create your first transaction</h2>
              <p className="text-white/40">Upload a contract PDF and let AI do the work, or skip for now.</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => { goToUpload(); }} className="w-full glass glass-hover p-6 rounded-xl text-left flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0 group-hover:bg-brand-500/25 transition-colors">
                  <Upload size={22} className="text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold">Upload a Contract</p>
                  <p className="text-white/40 text-sm">AI will extract all the details from your PDF</p>
                </div>
                <ArrowRight size={18} className="text-white/20 ml-auto" />
              </button>
              <button onClick={() => setStep(2)} className="w-full text-center py-3 text-white/40 hover:text-white/60 transition-colors text-sm">
                Skip for now →
              </button>
            </div>
            <button onClick={() => setStep(0)} className="flex items-center gap-1 text-white/30 hover:text-white/50 transition-colors text-sm mt-4">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        )}

        {/* Step 2: All Set */}
        {step === 2 && (
          <div className="glass rounded-2xl p-8 animate-slide-in text-center">
            <div className="w-20 h-20 rounded-2xl bg-accent-500/15 flex items-center justify-center mx-auto mb-6">
              <PartyPopper size={36} className="text-accent-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3">You're all set! 🎉</h2>
            <p className="text-white/50 mb-8">Your account is ready. Start managing your transactions like a pro.</p>
            {!showConfetti ? (
              <button onClick={handleComplete} className="btn-brand px-10 py-3 rounded-xl font-semibold">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={goToDashboard} className="btn-brand px-10 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
                Open Dashboard <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ['#6366f1', '#34d399', '#f59e0b', '#ec4899', '#3b82f6'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const dur = 2 + Math.random() * 2;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <div key={i} className="absolute confetti-piece" style={{
            left: `${left}%`, top: '-10px', width: size, height: size * 1.5,
            backgroundColor: color, borderRadius: '2px',
            animation: `confetti-fall ${dur}s ease-in ${delay}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }} />
        );
      })}
    </div>
  );
}
