import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Camera,
  ChevronRight,
  ClipboardList,
  Info,
  LogIn,
  LogOut,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const NAV_ITEMS = [
  { label: 'Camera', path: '/camera', icon: Camera },
  { label: 'My Complaints', path: '/status', icon: ClipboardList },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Analytics', path: '/heatmap', icon: BarChart2 },
  { label: 'Officer Login', path: '/officer/login', icon: Shield },
];

export default function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    user,
    mobileCitizenUser,
    logoutMobile,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logoutMobile();
    setSidebarOpen(false);
  };

  if (!sidebarOpen) return null;

  const displayUser = mobileCitizenUser
    ? { name: mobileCitizenUser.name, sub: 'Citizen · Logged in' }
    : { name: user.name, sub: `${user.totalComplaints} complaints submitted` };

  return (
    <>
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 animate-fade-in" onClick={() => setSidebarOpen(false)} />

      <div className="fixed left-0 top-0 h-full w-72 bg-cs-card z-50 flex flex-col shadow-2xl animate-slide-in-left border-r border-cs-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cs-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-cs-accent rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-semibold text-cs-ink">CivicSnap</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cs-subtle transition-colors">
            <X className="w-4 h-4 text-cs-muted" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-cs-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cs-accent/10 flex items-center justify-center text-cs-accent font-bold">
              {displayUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-cs-ink text-sm">{displayUser.name}</p>
              <p className="text-xs text-cs-muted">{displayUser.sub}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-cs-subtle rounded-xl p-2.5 text-center border border-cs-border">
              <p className="text-lg font-bold text-cs-ink">{user.totalComplaints}</p>
              <p className="text-xs text-cs-muted">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{user.validComplaints}</p>
              <p className="text-xs text-emerald-600">Valid</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;

            return (
              <button
                key={path}
                onClick={() => goTo(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 text-left text-sm font-medium ${
                  active ? 'bg-cs-accent text-white' : 'text-cs-muted hover:text-cs-ink hover:bg-cs-subtle'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </button>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-cs-border flex flex-col gap-1">
          {mobileCitizenUser ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cs-muted hover:text-red-600 hover:bg-red-50 transition-all duration-150"
              id="mobile-logout-btn"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => goTo('/mobile-login')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ background: 'var(--cs-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              id="mobile-login-btn"
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              <span>Citizen Login</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-cs-muted/60 text-xs px-3 py-1">
            <Info className="w-3.5 h-3.5" />
            <span>CivicSnap v1.0 · About</span>
          </div>
        </div>
      </div>
    </>
  );
}
