import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function MobileLogin() {
  const { loginMobile, registerCitizenAccount, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    identifier: '',
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCreateMode = mode === 'create';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isCreateMode && !form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!form.identifier.trim()) {
      setError('Enter your mobile number or email address.');
      return;
    }

    if (!form.password) {
      setError('Enter your password.');
      return;
    }

    if (isCreateMode && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isCreateMode) {
        const result = await registerCitizenAccount({
          name: form.name.trim(),
          identifier: form.identifier.trim(),
          password: form.password,
        });

        if (!result.success) {
          setError(result.message || 'Unable to create account.');
          return;
        }

        navigate('/camera', { replace: true });
        return;
      }

      const result = await loginMobile({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      if (result.success) {
        navigate('/camera', { replace: true });
      } else {
        setError(result.message || 'Unable to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      <div className="page-header">
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(true);
            navigate('/camera');
          }}
          className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl"
          id="mobile-login-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">Citizen Access</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-5 py-8 flex flex-col gap-6 bottom-safe">
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--cs-accent) 0%, #1e40af 100%)' }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--cs-ink)' }}>
                Welcome to CivicSnap
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
                Sign in or create a citizen account with your mobile number or email.
              </p>
            </div>
          </div>

          <div className="flex rounded-xl p-1 gap-1" style={{ background: '#FFFFFF', border: '1px solid var(--cs-border)' }}>
            {[
              { key: 'login', label: 'Sign In' },
              { key: 'create', label: 'Create Account' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMode(item.key);
                  setError('');
                }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={
                  mode === item.key
                    ? { background: 'var(--cs-accent)', color: '#fff' }
                    : { background: 'transparent', color: 'var(--cs-muted)' }
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ background: 'var(--cs-card)', borderColor: 'var(--cs-border)' }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {isCreateMode && (
                <div>
                  <label className="label" htmlFor="ml-name">Full Name</label>
                  <input
                    id="ml-name"
                    type="text"
                    className="input-field"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(event) => {
                      setForm({ ...form, name: event.target.value });
                      setError('');
                    }}
                    required={isCreateMode}
                  />
                </div>
              )}

              <div>
                <label className="label" htmlFor="ml-identifier">Mobile Number or Email</label>
                <input
                  id="ml-identifier"
                  type="text"
                  className="input-field"
                  placeholder="9876543210 or name@example.com"
                  value={form.identifier}
                  autoComplete="username"
                  onChange={(event) => {
                    setForm({ ...form, identifier: event.target.value });
                    setError('');
                  }}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="ml-password">Password</label>
                <div className="relative">
                  <input
                    id="ml-password"
                    type={showPw ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="Enter your password"
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(event) => {
                      setForm({ ...form, password: event.target.value });
                      setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cs-muted)', padding: 0 }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isCreateMode && (
                <div>
                  <label className="label" htmlFor="ml-confirm-password">Confirm Password</label>
                  <input
                    id="ml-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(event) => {
                      setForm({ ...form, confirmPassword: event.target.value });
                      setError('');
                    }}
                    required={isCreateMode}
                  />
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !form.identifier ||
                  !form.password ||
                  (isCreateMode && (!form.name || !form.confirmPassword))
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                id="ml-submit"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {isCreateMode ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {isCreateMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isCreateMode ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>
            </form>
          </div>

          <div
            className="rounded-xl px-4 py-3 text-xs flex flex-col gap-1"
            style={{ background: 'var(--cs-subtle)', border: '1px solid var(--cs-border)', color: 'var(--cs-muted)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--cs-ink)' }}>Citizen account rules</span>
            <span>Use a 10-digit mobile number or a valid email address.</span>
            <span>Citizen accounts are stored in the backend so you can sign in on any device.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
