import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import {
  LayoutDashboard, ClipboardList, BarChart2,
  Shield, LogOut, User, FileText, PlusCircle
} from 'lucide-react';
import OfficerDashboard from './OfficerDashboard.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import HeatmapScreen from './HeatmapScreen.jsx';
import ComplaintStatus from './ComplaintStatus.jsx';
import CitizenDesktopHome from './CitizenDesktopHome.jsx';

const NAV_ITEMS_CITIZEN = [
  { key: 'citizen-home', label: 'My Dashboard', icon: LayoutDashboard },
  { key: 'citizen-complaints', label: 'My Complaints', icon: ClipboardList },
];

const NAV_ITEMS_OFFICER = [
  { key: 'officer', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'status', label: 'All Complaints', icon: ClipboardList },
  { key: 'heatmap', label: 'Analytics', icon: BarChart2 },
];

const NAV_ITEMS_ADMIN = [
  { key: 'admin', label: 'Admin Panel', icon: Shield },
  { key: 'officer', label: 'Officer View', icon: LayoutDashboard },
  { key: 'status', label: 'Complaints', icon: ClipboardList },
  { key: 'heatmap', label: 'Analytics', icon: BarChart2 },
];

export default function DesktopLayout({ page }) {
  const { authUser, logoutDesktop, isAdminLoggedIn, isCitizenLoggedIn } = useApp();
  const navigate = useNavigate();

  const navItems = isCitizenLoggedIn
    ? NAV_ITEMS_CITIZEN
    : isAdminLoggedIn
    ? NAV_ITEMS_ADMIN
    : NAV_ITEMS_OFFICER;

  const defaultPage = isCitizenLoggedIn
    ? 'citizen-home'
    : isAdminLoggedIn
    ? 'admin'
    : 'officer';

  const [activePage, setActivePage] = useState(page || defaultPage);
  const [highlightFormCount, setHighlightFormCount] = useState(0);

  const triggerFormHighlight = () => {
    if (activePage !== 'citizen-home') {
      setActivePage('citizen-home');
      // Short delay so the page renders before scrolling
      setTimeout(() => setHighlightFormCount(c => c + 1), 100);
    } else {
      setHighlightFormCount(c => c + 1);
    }
  };

  const handleLogout = () => {
    logoutDesktop();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'citizen-home': return <CitizenDesktopHome onViewAll={() => setActivePage('citizen-complaints')} highlightForm={highlightFormCount} />;
      case 'citizen-complaints': return <ComplaintStatus />;
      case 'admin': return <AdminDashboard />;
      case 'officer': return <OfficerDashboard desktop />;
      case 'heatmap': return <HeatmapScreen />;
      case 'status': return <ComplaintStatus />;
      default: return isCitizenLoggedIn ? <CitizenDesktopHome onViewAll={() => setActivePage('citizen-complaints')} highlightForm={highlightFormCount} /> : <OfficerDashboard desktop />;
    }
  };

  const roleBadge = () => {
    if (authUser?.role === 'admin') return { label: 'Administrator', cls: 'bg-purple-50 text-purple-700' };
    if (authUser?.role === 'officer') return { label: 'Field Officer', cls: 'bg-blue-50 text-cs-accent' };
    return { label: 'Citizen', cls: 'bg-emerald-50 text-emerald-700' };
  };
  const badge = roleBadge();

  return (
    <div className="desktop-layout animate-fade-in">
      {/* Sidebar */}
      <aside className="desktop-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-cs-border">
          <div className="w-8 h-8 bg-cs-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-cs-ink font-semibold text-base tracking-tight">CivicSnap</span>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-cs-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cs-accent/10 flex items-center justify-center text-cs-accent font-semibold text-sm flex-shrink-0">
              {authUser?.name?.charAt(0) ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-cs-ink font-medium text-sm truncate">{authUser?.name ?? 'User'}</p>
              <p className="text-cs-muted text-xs truncate">{authUser?.dept ?? ''}</p>
            </div>
          </div>
          <span className={`mt-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2">
          <p className="text-cs-muted/60 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Navigation</p>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePage(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150 text-left
                ${activePage === key
                  ? 'bg-cs-accent text-white shadow-cs-accent/20 shadow-sm'
                  : 'text-cs-muted hover:text-cs-ink hover:bg-cs-subtle'}`}
              id={`nav-${key}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-4 border-t border-cs-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cs-muted hover:text-red-600 hover:bg-red-50 transition-all duration-150"
            id="desktop-logout"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="desktop-main overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-cs-card border-b border-cs-border flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-cs-ink">
              {navItems.find(n => n.key === activePage)?.label ?? 'Dashboard'}
            </h1>
            <p className="text-cs-muted text-xs mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isCitizenLoggedIn && (
              <button
                onClick={triggerFormHighlight}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150"
                style={{ background: 'var(--cs-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
                id="new-complaint-topbar"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Complaint
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-cs-muted bg-cs-subtle border border-cs-border rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              System online
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
