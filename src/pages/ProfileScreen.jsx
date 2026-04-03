import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Award, Star, TrendingUp, Shield } from 'lucide-react';

const BADGES = [
  { icon: '🏅', name: 'First Reporter', desc: 'Submitted first complaint', earned: true },
  { icon: '🎯', name: 'Active Citizen', desc: 'Submitted 3+ complaints', earned: true },
  { icon: '⭐', name: 'Good Reviewer', desc: 'Left 5+ reviews', earned: false },
  { icon: '🏆', name: 'Top Citizen', desc: 'Monthly top contributor', earned: false },
  { icon: '🌟', name: 'Impact Maker', desc: '10+ complaints resolved', earned: false },
  { icon: '🔥', name: 'Streak Hero', desc: '7-day reporting streak', earned: false },
];

export default function ProfileScreen() {
  const { user, complaints, setSidebarOpen } = useApp();
  const navigate = useNavigate();

  const resolutionRate = complaints.length
    ? Math.round((complaints.filter(c => c.status === 'Resolved').length / complaints.length) * 100)
    : 0;

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="page-title">My Profile</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-4 py-4 flex flex-col gap-4 bottom-safe">
          {/* Profile hero */}
          <div className="card flex flex-col items-center py-6 gap-2.5">
            <div className="w-16 h-16 rounded-full bg-cs-accent/10 flex items-center justify-center text-2xl font-bold text-cs-accent border-2 border-accent/20">
              {user.name.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-cs-ink">{user.name}</h2>
              <p className="text-cs-muted text-sm">Citizen Reporter</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium text-cs-accent">
              <Shield className="w-3.5 h-3.5" /> Verified Citizen
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total', value: complaints.length, color: 'text-cs-ink', bg: 'bg-cs-card' },
              { label: 'Valid', value: user.validComplaints, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Rate', value: `${resolutionRate}%`, color: 'text-cs-accent', bg: 'bg-blue-50', border: 'border-blue-100' },
            ].map(({ label, value, color, bg, border = 'border-cs-border' }) => (
              <div key={label} className={`rounded-2xl p-4 text-center border shadow-card ${bg} ${border}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-cs-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Monthly impact */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">Monthly Impact (April)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Filed', value: 2, icon: '📋' },
                { label: 'Resolved', value: 1, icon: '✅' },
                { label: 'Score', value: '85%', icon: '💥' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-cs-subtle rounded-xl p-3 text-center border border-cs-border">
                  <span className="text-lg">{icon}</span>
                  <p className="text-base font-bold text-cs-ink mt-1">{value}</p>
                  <p className="text-cs-muted text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly recognition */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-amber-800">Monthly Recognition</span>
            </div>
            <p className="text-amber-800/70 text-sm">
              You're among the top 10% reporters in your district this month. Keep going!
            </p>
          </div>

          {/* Badges */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">Badges</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map(({ icon, name, desc, earned }) => (
                <div
                  key={name}
                  className={`card text-center py-3 flex flex-col items-center gap-1 transition-all
                    ${earned ? 'border-accent/20 shadow-card-md' : 'opacity-40 grayscale'}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-semibold text-cs-ink leading-tight">{name}</span>
                  <span className="text-cs-muted text-xs leading-tight">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
