import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import AppLogo from '../components/AppLogo.jsx';

export default function OfficerLogin() {
  const { t } = useTranslation();
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
      setError(t('officerLogin.errors.enterEmail'));
      return;
    }

    if (!credentials.password) {
      setError(t('officerLogin.errors.enterPassword'));
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
      setError(result.message || t('officerLogin.errors.invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <div className="screen bg-cs-bg items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <AppLogo
            stacked
            showTitle={false}
            imageClassName="w-[120px] h-auto"
            clickable={false}
          />
        </div>

        <h2 className="text-2xl font-bold text-cs-ink mb-1">{t('officerLogin.title')}</h2>
        <p className="text-cs-muted text-sm mb-6">{t('officerLogin.subtitle')}</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="officer-email">{t('common.email')}</label>
            <input
              id="officer-email"
              type="email"
              className="input-field"
              placeholder={t('officerLogin.emailPlaceholder')}
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="officer-password">{t('common.password')}</label>
            <div className="relative">
              <input
                id="officer-password"
                type={showPwd ? 'text' : 'password'}
                className="input-field pr-11"
                placeholder={t('officerLogin.passwordPlaceholder')}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cs-muted hover:text-cs-ink transition-colors"
                tabIndex={-1}
                aria-label={showPwd ? t('common.hidePassword') : t('common.showPassword')}
              >
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
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('officerLogin.signingIn')}</>
              : <><span>{t('common.signIn')}</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 p-4 bg-cs-subtle rounded-xl border border-cs-border">
          <p className="text-xs font-semibold text-cs-muted uppercase tracking-wide mb-2">{t('officerLogin.backendLoginTitle')}</p>
          <p className="text-cs-ink text-xs">
            {t('officerLogin.backendLoginBody')}
          </p>
        </div>
      </div>
    </div>
  );
}
