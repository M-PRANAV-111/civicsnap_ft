import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import AppLogo from '../components/AppLogo.jsx';

export default function MobileLogin() {
  const { t } = useTranslation();
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
      setError(t('mobileLogin.errors.enterFullName'));
      return;
    }

    if (!form.identifier.trim()) {
      setError(t('mobileLogin.errors.enterIdentifier'));
      return;
    }

    if (!form.password) {
      setError(t('mobileLogin.errors.enterPassword'));
      return;
    }

    if (isCreateMode && form.password !== form.confirmPassword) {
      setError(t('mobileLogin.errors.passwordMismatch'));
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
          setError(result.message || t('mobileLogin.errors.createFailed'));
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
        setError(result.message || t('mobileLogin.errors.signInFailed'));
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
        <span className="page-title">{t('mobileLogin.title')}</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-5 py-8 flex flex-col gap-6 bottom-safe">
          <div className="flex flex-col items-center gap-4 py-4">
            <AppLogo
              stacked
              showTitle={false}
              imageClassName="w-[120px] h-auto"
              clickable={false}
            />
            <div className="text-center">
              <h1 className="text-xl font-bold" style={{ color: 'var(--cs-ink)' }}>
                {t('mobileLogin.welcomeTitle')}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
                {t('mobileLogin.welcomeSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex rounded-xl p-1 gap-1" style={{ background: '#FFFFFF', border: '1px solid var(--cs-border)' }}>
            {[
              { key: 'login', label: t('common.signIn') },
              { key: 'create', label: t('common.createAccount') },
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
                  <label className="label" htmlFor="ml-name">{t('common.fullName')}</label>
                  <input
                    id="ml-name"
                    type="text"
                    className="input-field"
                    placeholder={t('common.enterFullName')}
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
                <label className="label" htmlFor="ml-identifier">{t('common.mobileOrEmail')}</label>
                <input
                  id="ml-identifier"
                  type="text"
                  className="input-field"
                  placeholder={t('common.identifierPlaceholder')}
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
                <label className="label" htmlFor="ml-password">{t('common.password')}</label>
                <div className="relative">
                  <input
                    id="ml-password"
                    type={showPw ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder={t('common.enterPassword')}
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
                    aria-label={showPw ? t('common.hidePassword') : t('common.showPassword')}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isCreateMode && (
                <div>
                  <label className="label" htmlFor="ml-confirm-password">{t('common.confirmPassword')}</label>
                  <input
                    id="ml-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    className="input-field"
                    placeholder={t('common.reEnterPassword')}
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
                    {isCreateMode ? t('common.loadingCreatingAccount') : t('common.loadingSigningIn')}
                  </>
                ) : (
                  <>
                    {isCreateMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isCreateMode ? t('mobileLogin.submitCreate') : t('mobileLogin.submitLogin')}
                  </>
                )}
              </button>
            </form>
          </div>

          <div
            className="rounded-xl px-4 py-3 text-xs flex flex-col gap-1"
            style={{ background: 'var(--cs-subtle)', border: '1px solid var(--cs-border)', color: 'var(--cs-muted)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--cs-ink)' }}>{t('mobileLogin.rulesTitle')}</span>
            <span>{t('mobileLogin.rulesLine1')}</span>
            <span>{t('mobileLogin.rulesLine2')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
