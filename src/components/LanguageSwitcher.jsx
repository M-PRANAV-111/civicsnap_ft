import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = ['en', 'hi', 'te'];

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <div
      className={`flex items-center gap-1 rounded-2xl border shadow-sm ${compact ? 'px-2 py-2' : 'px-2 py-2.5'}`}
      style={{
        background: 'rgba(255,255,255,0.96)',
        borderColor: 'var(--cs-border)',
        backdropFilter: 'blur(12px)',
      }}
      aria-label={t('languageSwitcher.label')}
    >
      {!compact && <Languages className="w-4 h-4" style={{ color: 'var(--cs-muted)' }} />}
      {LANGUAGES.map((languageCode) => {
        const isActive = activeLanguage.startsWith(languageCode);

        return (
          <button
            key={languageCode}
            type="button"
            onClick={() => i18n.changeLanguage(languageCode)}
            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-150"
            style={
              isActive
                ? { background: 'var(--cs-accent)', color: '#FFFFFF' }
                : { background: 'transparent', color: 'var(--cs-muted)' }
            }
            title={t(`languageSwitcher.${languageCode === 'en' ? 'english' : languageCode === 'hi' ? 'hindi' : 'telugu'}`)}
          >
            {t(`languageSwitcher.${languageCode}`)}
          </button>
        );
      })}
    </div>
  );
}
