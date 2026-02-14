import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Home, LayoutDashboard, Upload, Bell, Users, LogIn, LogOut } from 'lucide-react';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="glass border-t-0 border-x-0 rounded-none px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-sm">CP</div>
        ClosePilot
      </Link>
      <div className="flex items-center gap-1">
        {user ? (
          <>
            <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavLink to="/upload" icon={<Upload size={18} />} label="Upload" />
            <NavLink to="/reminders" icon={<Bell size={18} />} label="Reminders" />
            <NavLink to="/vendors" icon={<Users size={18} />} label="Vendors" />
            <span className="text-white/60 text-sm ml-3 mr-2">{user.name}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-1 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm">
              <LogOut size={16} /> Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="flex items-center gap-1 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm">
            <LogIn size={16} /> Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-1.5 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm">
      {icon} <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
