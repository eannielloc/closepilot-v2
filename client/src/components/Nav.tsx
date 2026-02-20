import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Home, LayoutDashboard, Upload, Bell, Users, LogIn, LogOut, Menu, X, Settings, Kanban, BarChart3 } from 'lucide-react';
import { ThemeToggle, useTheme } from './ThemeToggle';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const links = user ? [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/pipeline', icon: <Kanban size={18} />, label: 'Pipeline' },
    { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
    { to: '/upload', icon: <Upload size={18} />, label: 'Upload' },
    { to: '/reminders', icon: <Bell size={18} />, label: 'Reminders' },
    { to: '/vendors', icon: <Users size={18} />, label: 'Vendors' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ] : [];

  return (
    <nav className="bg-[#09090f]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-sm">CP</div>
          <span className="hidden sm:inline">ClosePilot</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${location.pathname === l.to ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              {l.icon} {l.label}
            </Link>
          ))}
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          {user ? (
            <>
              <span className="text-white/60 text-sm ml-3 mr-2">{user.name}</span>
              <button onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-1 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm">
              <LogIn size={16} /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/60 hover:text-white">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/10 space-y-1 animate-slide-in">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${location.pathname === l.to ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              {l.icon} {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { logout(); navigate('/'); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition w-full">
              <LogOut size={18} /> Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition">
              <LogIn size={18} /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
