import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Award, Star, TrendingUp, Shield } from 'lucide-react';

const BADGES = [
  { icon: '🏅', titleKey: 'firstReporter', descKey: 'firstReporterDesc', earned: true },
  { icon: '🎯', titleKey: 'activeCitizen', descKey: 'activeCitizenDesc', earned: true },
  { icon: '⭐', titleKey: 'goodReviewer', descKey: 'goodReviewerDesc', earned: false },
  { icon: '🏆', titleKey: 'topCitizen', descKey: 'topCitizenDesc', earned: false },
  { icon: '🌟', titleKey: 'impactMaker', descKey: 'impactMakerDesc', earned: false },
  { icon: '🔥', titleKey: 'streakHero', descKey: 'streakHeroDesc', earned: false },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, complaints, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const profileUser = user || { name: t('profile.userFallback'), validComplaints: 0 };

  const resolutionRate = complaints.length
    ? Math.round((complaints.filter((complaint) => complaint.status === 'Resolved').length / complaints.length) * 100)
    : 0;

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">{t('profile.title')}</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-4 py-4 flex flex-col gap-4 bottom-safe">
          <div className="card flex flex-col items-center py-6 gap-2.5">
            <div className="w-16 h-16 rounded-full bg-cs-accent/10 flex items-center justify-center text-2xl font-bold text-cs-accent border-2 border-accent/20">
              {profileUser.name.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-cs-ink">{profileUser.name}</h2>
              <p className="text-cs-muted text-sm">{t('profile.citizenReporter')}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium text-cs-accent">
              <Shield className="w-3.5 h-3.5" /> {t('profile.verifiedCitizen')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: t('common.total'), value: complaints.length, color: 'text-cs-ink', bg: 'bg-cs-card' },
              { label: t('common.valid'), value: profileUser.validComplaints || 0, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: t('profile.rate'), value: `${resolutionRate}%`, color: 'text-cs-accent', bg: 'bg-blue-50', border: 'border-blue-100' },
            ].map(({ label, value, color, bg, border = 'border-cs-border' }) => (
              <div key={label} className={`rounded-2xl p-4 text-center border shadow-card ${bg} ${border}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-cs-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">{t('profile.monthlyImpactTitle')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t('profile.filed'), value: 2, icon: '📋' },
                { label: t('statuses.resolved'), value: 1, icon: '✅' },
                { label: t('profile.score'), value: '85%', icon: '💥' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-cs-subtle rounded-xl p-3 text-center border border-cs-border">
                  <span className="text-lg">{icon}</span>
                  <p className="text-base font-bold text-cs-ink mt-1">{value}</p>
                  <p className="text-cs-muted text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-800">{t('profile.monthlyRecognition')}</span>
            </div>
            <p className="text-amber-800/70 text-sm">
              {t('profile.monthlyRecognitionBody')}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">{t('profile.badges')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map(({ icon, titleKey, descKey, earned }) => (
                <div
                  key={titleKey}
                  className={`card text-center py-3 flex flex-col items-center gap-1 transition-all
                    ${earned ? 'border-accent/20 shadow-card-md' : 'opacity-40 grayscale'}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-semibold text-cs-ink leading-tight">{t(`profile.badgeTitles.${titleKey}`)}</span>
                  <span className="text-cs-muted text-xs leading-tight">{t(`profile.badgeDescriptions.${descKey}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
