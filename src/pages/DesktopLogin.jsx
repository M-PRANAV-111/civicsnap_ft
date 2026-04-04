import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Shield, User, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import InstallCornerButton from '../components/InstallCornerButton.jsx';
import AppLogo from '../components/AppLogo.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

const ROLES = [
  {
    key: 'citizen',
    labelKey: 'common.citizen',
    icon: User,
    headingKey: 'desktopLogin.citizenHeading',
    subtitleKey: 'desktopLogin.citizenSubtitle',
  },
  {
    key: 'officer',
    labelKey: 'common.officer',
    icon: UserCheck,
    headingKey: 'desktopLogin.officerHeading',
    subtitleKey: 'desktopLogin.officerSubtitle',
  },
  {
    key: 'admin',
    labelKey: 'common.admin',
    icon: Shield,
    headingKey: 'desktopLogin.adminHeading',
    subtitleKey: 'desktopLogin.adminSubtitle',
  },
];

export default function DesktopLogin() {
  const { t } = useTranslation();
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
  const roleLabel = t(roleConfig.labelKey);
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
      setError(t('desktopLogin.errors.enterFullName'));
      return;
    }

    if (!identifier) {
      setError(isCitizen ? t('desktopLogin.errors.enterIdentifier') : t('desktopLogin.errors.enterEmail'));
      return;
    }

    if (!password) {
      setError(t('desktopLogin.errors.enterPassword'));
      return;
    }

    if (isCreateCitizen && password !== form.confirmPassword) {
      setError(t('desktopLogin.errors.passwordMismatch'));
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
          setError(result.message || t('desktopLogin.errors.createFailed'));
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
        setError(result.message || t('desktopLogin.errors.signInFailed'));
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
      <div className="absolute top-5 right-5 z-10 hidden md:flex items-center gap-2">
        <LanguageSwitcher />
        <InstallCornerButton label={t('install.installApp')} />
      </div>

      <div className="hidden md:flex flex-col w-[42%] p-12" style={{ background: 'var(--cs-accent)' }}>
        <AppLogo
          imageClassName="h-10 w-auto flex-shrink-0"
          titleClassName="text-white font-semibold text-lg tracking-tight"
        />

        <div className="flex-1 flex items-center">
          <div>
            <h1 className="text-white text-4xl font-bold leading-snug mb-4">
              {t('desktopLogin.heroTitleLine1')}
              <br />
              {t('desktopLogin.heroTitleLine2')}
            </h1>
            <p className="text-blue-200 text-base leading-relaxed max-w-xs">
              {t('desktopLogin.heroSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <AppLogo
              stacked
              showTitle={false}
              imageClassName="w-[120px] h-auto"
              clickable={false}
            />
          </div>

          <div className="flex rounded-xl p-1 mb-8 gap-1" style={{ background: 'var(--cs-subtle)', border: '1px solid var(--cs-border)' }}>
            {ROLES.map(({ key, labelKey, icon: Icon }) => (
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
                {t(labelKey)}
              </button>
            ))}
          </div>

          {isCitizen && (
            <div className="flex rounded-xl p-1 mb-6 gap-1" style={{ background: '#FFFFFF', border: '1px solid var(--cs-border)' }}>
              {[
                { key: 'login', label: t('common.signIn') },
                { key: 'create', label: t('common.createAccount') },
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
            <h2 className="text-2xl font-bold" style={{ color: 'var(--cs-ink)' }}>{t(roleConfig.headingKey)}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>{t(roleConfig.subtitleKey)}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
            {isCreateCitizen && (
              <div>
                <label className="label" htmlFor="citizen-name">{t('common.fullName')}</label>
                <input
                  id="citizen-name"
                  type="text"
                  className="input-field"
                  placeholder={t('common.enterFullName')}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="login-identifier">
                {isCitizen ? t('common.mobileOrEmail') : t('common.email')}
              </label>
              <input
                id="login-identifier"
                type="text"
                className="input-field"
                placeholder={isCitizen ? t('common.identifierPlaceholder') : t('common.enterEmail')}
                value={form.identifier}
                onChange={(event) => setForm({ ...form, identifier: event.target.value })}
                autoComplete={isCitizen ? 'username' : 'email'}
              />
            </div>

            <div>
              <label className="label" htmlFor="login-password">{t('common.password')}</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingRight: '2.75rem' }}
                  placeholder={t('common.enterPassword')}
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
                  aria-label={showPwd ? t('common.hidePassword') : t('common.showPassword')}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isCreateCitizen && (
              <div>
                <label className="label" htmlFor="citizen-confirm-password">{t('common.confirmPassword')}</label>
                <input
                  id="citizen-confirm-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  placeholder={t('common.reEnterPassword')}
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
                <><Loader2 className="w-4 h-4 animate-spin" /> {isCreateCitizen ? t('common.loadingCreatingAccount') : t('common.loadingSigningIn')}</>
              ) : (
                <>
                  <span>{isCreateCitizen ? t('desktopLogin.createCitizenAccount') : t('desktopLogin.signInAs', { role: roleLabel })}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl border" style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
            {isCitizen ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--cs-muted)' }}>
                  {t('desktopLogin.citizenRulesTitle')}
                </p>
                <p className="text-xs" style={{ color: 'var(--cs-ink)' }}>
                  {t('desktopLogin.citizenRulesBody')}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--cs-muted)' }}>
                  {t('desktopLogin.backendLoginTitle')}
                </p>
                <p className="text-xs" style={{ color: 'var(--cs-ink)' }}>
                  {t('desktopLogin.backendLoginBody')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
