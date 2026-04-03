import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function OfficerLogin() {
  const { loginDesktop } = useApp();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.email.trim()) {
      setError('Enter your officer email address.');
      return;
    }

    if (!credentials.password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);

    const result = await loginDesktop({
      username: credentials.email,
      password: credentials.password,
      role: 'officer',
    });

    if (result.success) {
      navigate('/officer/dashboard');
    } else {
      setError(result.message || 'Invalid officer credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="screen bg-cs-bg items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-cs-accent rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-semibold text-cs-ink text-lg">CivicSnap</span>
        </div>

        <h2 className="text-2xl font-bold text-cs-ink mb-1">Officer Login</h2>
        <p className="text-cs-muted text-sm mb-6">Sign in to your officer account</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="officer-email">Email</label>
            <input id="officer-email" type="email" className="input-field" placeholder="Enter officer email"
              value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} required />
          </div>

          <div>
            <label className="label" htmlFor="officer-password">Password</label>
            <div className="relative">
              <input id="officer-password" type={showPwd ? 'text' : 'password'} className="input-field pr-11"
                placeholder="Enter password" value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cs-muted hover:text-cs-ink transition-colors" tabIndex={-1}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-1" id="officer-login-btn">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 p-4 bg-cs-subtle rounded-xl border border-cs-border">
          <p className="text-xs font-semibold text-cs-muted uppercase tracking-wide mb-2">Backend login</p>
          <p className="text-cs-ink text-xs">
            Use a seeded officer email/password from the backend. Successful sign-ins store the JWT in <code>civicsnap_token</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
