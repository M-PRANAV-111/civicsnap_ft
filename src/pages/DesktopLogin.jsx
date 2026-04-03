import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle, User, Shield, UserCheck } from 'lucide-react';

const ROLES = [
  {
    key: 'citizen',
    label: 'Citizen',
    icon: User,
    heading: 'Welcome back',
    subtitle: 'Sign in to track & report civic issues',
    placeholder: 'Enter citizen ID',
    demo: { u: 'citizen', p: 'citizen123' },
  },
  {
    key: 'officer',
    label: 'Officer',
    icon: UserCheck,
    heading: 'Officer portal',
    subtitle: 'Sign in to manage assigned complaints',
    placeholder: 'Enter officer ID',
    demo: { u: 'officer', p: 'officer123' },
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: Shield,
    heading: 'Admin console',
    subtitle: 'Sign in with administrator credentials',
    placeholder: 'Enter admin ID',
    demo: { u: 'admin', p: 'admin123' },
  },
];

export default function DesktopLogin() {
  const { loginDesktop } = useApp();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('citizen');
  const [usernameVal, setUsernameVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleConfig = ROLES.find(r => r.key === activeRole);

  const switchRole = (key) => {
    setActiveRole(key);
    setUsernameVal('');
    setPasswordVal('');
    setError('');
    setShowPwd(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = usernameVal.trim();
    const password = passwordVal;
    if (!username || !password) return;
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const result = loginDesktop({ username, password });
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(`Invalid credentials. Try: ${roleConfig.demo.u} / ${roleConfig.demo.p}`);
    }
  };

  const fillDemo = () => {
    setUsernameVal(roleConfig.demo.u);
    setPasswordVal(roleConfig.demo.p);
    setError('');
  };

  const isReady = usernameVal.trim().length > 0 && passwordVal.length > 0 && !loading;

  return (
    <div className="h-full w-full flex" style={{ background: 'var(--cs-bg)' }}>
      {/* Left panel — branding */}
      <div className="hidden md:flex flex-col justify-between w-[42%] p-12"
        style={{ background: 'var(--cs-accent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">CivicSnap</span>
        </div>

        <div>
          <h1 className="text-white text-4xl font-bold leading-snug mb-4">
            Governance,<br />made simple.
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-xs">
            A unified platform for citizens to report civic issues and for officers to resolve them — fast.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { value: '12,400+', label: 'Issues reported' },
            { value: '73%',     label: 'Resolution rate' },
            { value: '6 dists', label: 'Coverage area' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-white text-xl font-bold">{value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--cs-accent)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="font-semibold text-lg" style={{ color: 'var(--cs-ink)' }}>CivicSnap</span>
          </div>

          {/* Role tabs */}
          <div className="flex rounded-xl p-1 mb-8 gap-1"
            style={{ background: 'var(--cs-subtle)', border: '1px solid var(--cs-border)' }}>
            {ROLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                id={`role-tab-${key}`}
                onClick={() => switchRole(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={activeRole === key
                  ? { background: 'var(--cs-accent)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                  : { background: 'transparent', color: 'var(--cs-muted)' }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{roleConfig.heading}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>{roleConfig.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
            <div>
              <label className="label" htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                className="input-field"
                placeholder={roleConfig.placeholder}
                value={usernameVal}
                onChange={e => setUsernameVal(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder="Enter your password"
                  value={passwordVal}
                  onChange={e => setPasswordVal(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cs-muted)', padding: 0 }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-3 py-3"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isReady}
              className="btn-primary mt-1"
              style={{ opacity: isReady ? 1 : 0.5, cursor: isReady ? 'pointer' : 'not-allowed' }}
              id="login-submit"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <><span>Sign in as {roleConfig.label}</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          {/* Demo hint — click to auto-fill */}
          <div className="mt-6 p-4 rounded-xl border"
            style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cs-muted)' }}>
                Demo credentials
              </p>
              <button
                type="button"
                onClick={fillDemo}
                id="fill-demo-btn"
                className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150"
                style={{ background: 'var(--cs-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Auto-fill
              </button>
            </div>
            <code className="text-xs font-mono" style={{ color: 'var(--cs-ink)' }}>
              {roleConfig.demo.u} / {roleConfig.demo.p}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
