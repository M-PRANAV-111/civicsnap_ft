import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import AppLogo from './AppLogo.jsx';

const NAV_ITEMS = [
  { labelKey: 'common.camera', path: '/camera', icon: Camera },
  { labelKey: 'common.myComplaints', path: '/status', icon: ClipboardList },
  { labelKey: 'common.profile', path: '/profile', icon: User },
  { labelKey: 'common.analytics', path: '/heatmap', icon: BarChart2 },
  { labelKey: 'common.officer', path: '/officer/login', icon: Shield, appendLogin: true },
];

export default function Sidebar() {
  const { t } = useTranslation();
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
    ? { name: mobileCitizenUser.name, sub: t('sidebar.citizenLoggedIn') }
    : { name: user.name, sub: t('sidebar.complaintsSubmitted', { count: user.totalComplaints }) };

  return (
    <>
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 animate-fade-in" onClick={() => setSidebarOpen(false)} />

      <div className="fixed left-0 top-0 h-full w-72 bg-cs-card z-50 flex flex-col shadow-2xl animate-slide-in-left border-r border-cs-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cs-border">
          <AppLogo
            imageClassName="h-8 w-auto flex-shrink-0"
            titleClassName="font-semibold text-cs-ink"
          />
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
              <p className="text-xs text-cs-muted">{t('common.total')}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{user.validComplaints}</p>
              <p className="text-xs text-emerald-600">{t('common.valid')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map(({ labelKey, path, icon: Icon, appendLogin }) => {
            const active = location.pathname === path;
            const label = appendLogin ? `${t(labelKey)} ${t('login')}` : t(labelKey);

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
              <span>{t('common.signOut')}</span>
            </button>
          ) : (
            <button
              onClick={() => goTo('/mobile-login')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ background: 'var(--cs-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              id="mobile-login-btn"
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              <span>{t('common.citizenLogin')}</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-cs-muted/60 text-xs px-3 py-1">
            <Info className="w-3.5 h-3.5" />
            <span>{t('sidebar.version')}</span>
          </div>
        </div>
      </div>
    </>
  );
}
