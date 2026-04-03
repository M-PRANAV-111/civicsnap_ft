import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Shield, User, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import InstallCornerButton from '../components/InstallCornerButton.jsx';

const ROLES = [
  {
    key: 'citizen',
    label: 'Citizen',
    icon: User,
    heading: 'Citizen access',
    subtitle: 'Sign in or create a citizen account with your mobile number or email.',
  },
  {
    key: 'officer',
    label: 'Officer',
    icon: UserCheck,
    heading: 'Officer portal',
    subtitle: 'Sign in to manage assigned complaints.',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: Shield,
    heading: 'Admin console',
    subtitle: 'Sign in with administrator credentials.',
  },
];

export default function DesktopLogin() {
  const { loginDesktop, registerCitizenAccount } = useApp();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('citizen');
  const [citizenMode, setCitizenMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    identifier: '',
    password: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleConfig = ROLES.find((role) => role.key === activeRole);
  const isCitizen = activeRole === 'citizen';
  const isCreateCitizen = isCitizen && citizenMode === 'create';

  useEffect(() => {
    setForm({ name: '', identifier: '', password: '', confirmPassword: '' });
    setError('');
    setShowPwd(false);
  }, [activeRole, citizenMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const identifier = form.identifier.trim();
    const password = form.password;

    if (isCreateCitizen && !form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!identifier) {
      setError(isCitizen ? 'Enter your mobile number or email address.' : 'Enter your email address.');
      return;
    }

    if (!password) {
      setError('Enter your password.');
      return;
    }

    if (isCreateCitizen && password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isCreateCitizen) {
        const result = await registerCitizenAccount({
          name: form.name.trim(),
          identifier,
          password,
        });

        if (!result.success) {
          setError(result.message || 'Unable to create your account.');
          return;
        }

        navigate('/dashboard');
        return;
      }

      const result = await loginDesktop({
        username: identifier,
        password,
        role: activeRole,
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Unable to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isReady =
    !loading &&
    form.identifier.trim().length > 0 &&
    form.password.length > 0 &&
    (!isCreateCitizen || (form.name.trim().length > 0 && form.confirmPassword.length > 0));

  return (
    <div className="relative h-full w-full flex" style={{ background: 'var(--cs-bg)' }}>
      <div className="absolute top-5 right-5 z-10 hidden md:block">
        <InstallCornerButton label="Install App" />
      </div>

      <div className="hidden md:flex flex-col w-[42%] p-12" style={{ background: 'var(--cs-accent)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">CivicSnap</span>
        </div>

        <div className="flex-1 flex items-center">
          <div>
            <h1 className="text-white text-4xl font-bold leading-snug mb-4">
              Governance,
              <br />
              made simple.
            </h1>
            <p className="text-blue-200 text-base leading-relaxed max-w-xs">
              A unified platform for citizens to report civic issues and for officers to resolve them fast.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--cs-accent)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <span className="font-semibold text-lg" style={{ color: 'var(--cs-ink)' }}>CivicSnap</span>
          </div>

          <div className="flex rounded-xl p-1 mb-8 gap-1" style={{ background: 'var(--cs-subtle)', border: '1px solid var(--cs-border)' }}>
            {ROLES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveRole(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={
                  activeRole === key
                    ? { background: 'var(--cs-accent)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                    : { background: 'transparent', color: 'var(--cs-muted)' }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {isCitizen && (
            <div className="flex rounded-xl p-1 mb-6 gap-1" style={{ background: '#FFFFFF', border: '1px solid var(--cs-border)' }}>
              {[
                { key: 'login', label: 'Sign In' },
                { key: 'create', label: 'Create Account' },
              ].map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setCitizenMode(mode.key)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={
                    citizenMode === mode.key
                      ? { background: 'var(--cs-accent)', color: '#fff' }
                      : { background: 'transparent', color: 'var(--cs-muted)' }
                  }
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{roleConfig.heading}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>{roleConfig.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
            {isCreateCitizen && (
              <div>
                <label className="label" htmlFor="citizen-name">Full Name</label>
                <input
                  id="citizen-name"
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="login-identifier">
                {isCitizen ? 'Mobile Number or Email' : 'Email'}
              </label>
              <input
                id="login-identifier"
                type="text"
                className="input-field"
                placeholder={isCitizen ? '9876543210 or name@example.com' : 'Enter your email'}
                value={form.identifier}
                onChange={(event) => setForm({ ...form, identifier: event.target.value })}
                autoComplete={isCitizen ? 'username' : 'email'}
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
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((value) => !value)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cs-muted)',
                    padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isCreateCitizen && (
              <div>
                <label className="label" htmlFor="citizen-confirm-password">Confirm Password</label>
                <input
                  id="citizen-confirm-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl px-3 py-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isReady}
              className="btn-primary mt-1"
              style={{ opacity: isReady ? 1 : 0.5, cursor: isReady ? 'pointer' : 'not-allowed' }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isCreateCitizen ? 'Creating account...' : 'Signing in...'}</>
              ) : (
                <>
                  <span>{isCreateCitizen ? 'Create Citizen Account' : `Sign in as ${roleConfig.label}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl border" style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            {isCitizen ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--cs-muted)' }}>
                  Citizen account rules
                </p>
                <p className="text-xs" style={{ color: 'var(--cs-ink)' }}>
                  Use either a 10-digit mobile number or a valid email address. Citizen accounts are now stored in the backend so your login works across devices.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--cs-muted)' }}>
                  Backend login
                </p>
                <p className="text-xs" style={{ color: 'var(--cs-ink)' }}>
                  Use the seeded backend email/password for this role. Successful logins store the returned JWT and unlock protected dashboard requests.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
