import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart2,
  Loader2,
  MapPin,
  Menu,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

function getHeatColor(rate) {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 65) return 'bg-emerald-300';
  if (rate >= 45) return 'bg-amber-300';
  return 'bg-red-300';
}

function SummaryCard({ label, value, icon: Icon, textClass, bgClass, borderClass = 'border-cs-border' }) {
  return (
    <div className={`rounded-2xl p-4 text-center border shadow-card flex flex-col items-center gap-1 ${bgClass} ${borderClass}`}>
      <Icon className={`w-4 h-4 ${textClass}`} />
      <p className={`text-xl font-bold ${textClass}`}>{value}</p>
      <p className="text-cs-muted text-xs">{label}</p>
    </div>
  );
}

function HeatCell({ rate }) {
  return (
    <div className={`w-full h-full rounded-lg ${getHeatColor(rate)} flex items-center justify-center opacity-90`}>
      <span className="text-white text-xs font-bold drop-shadow">{rate}%</span>
    </div>
  );
}

export default function HeatmapScreen() {
  const { apiFetch, setSidebarOpen } = useApp();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await apiFetch('/api/analytics/overview');
      setAnalytics(payload);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const summary = analytics?.summary || {
    totalComplaints: 0,
    resolvedComplaints: 0,
    resolutionRate: 0,
    totalCitizens: 0,
  };
  const departmentBreakdown = analytics?.departmentBreakdown || [];
  const monthlyTrend = analytics?.monthlyTrend || [];
  const topDepartments = departmentBreakdown.slice(0, 6);

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <Menu className="w-4 h-4" />
        </button>
        <span className="page-title">Analytics</span>
        <button type="button" onClick={loadAnalytics} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="scrollable">
        <div className="px-4 py-4 flex flex-col gap-5 bottom-safe">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cs-accent" />
              <p className="text-sm text-cs-muted">Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="card flex flex-col items-center text-center gap-3 py-10">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-cs-ink">Could not load analytics</p>
                <p className="text-xs mt-1 text-cs-muted">{error}</p>
              </div>
              <button type="button" onClick={loadAnalytics} className="btn-secondary w-auto px-6">
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <SummaryCard label="Total" value={summary.totalComplaints} icon={Activity} textClass="text-cs-ink" bgClass="bg-cs-card" />
                <SummaryCard label="Resolved" value={summary.resolvedComplaints} icon={TrendingUp} textClass="text-emerald-700" bgClass="bg-emerald-50" borderClass="border-emerald-100" />
                <SummaryCard label="Rate" value={`${summary.resolutionRate}%`} icon={BarChart2} textClass="text-cs-accent" bgClass="bg-blue-50" borderClass="border-blue-100" />
                <SummaryCard label="Citizens" value={summary.totalCitizens} icon={MapPin} textClass="text-violet-700" bgClass="bg-violet-50" borderClass="border-violet-100" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-cs-accent" />
                  <span className="text-sm font-semibold text-cs-ink">Department Resolution Heatmap</span>
                </div>
                <div className="flex items-center gap-4 mb-3 text-xs text-cs-muted">
                  {[
                    { color: 'bg-emerald-500', label: '80%+' },
                    { color: 'bg-emerald-300', label: '65%+' },
                    { color: 'bg-amber-300', label: '45%+' },
                    { color: 'bg-red-300', label: '<45%' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-sm ${color}`} />
                      {label}
                    </div>
                  ))}
                </div>
                <div className="card p-3">
                  {topDepartments.length === 0 ? (
                    <p className="text-sm text-cs-muted text-center py-6">No complaints yet, so analytics will appear once backend data exists.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2" style={{ minHeight: '110px' }}>
                      {topDepartments.map((department) => (
                        <div key={department.departmentId} className="flex flex-col gap-1">
                          <div className="h-11">
                            <HeatCell rate={department.resolutionRate} />
                          </div>
                          <p className="text-cs-muted text-xs text-center truncate">{department.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-cs-ink">Department Breakdown</span>
                  <span className="text-xs text-cs-muted">Resolution Rate</span>
                </div>
                <div className="flex flex-col gap-2">
                  {departmentBreakdown.length === 0 ? (
                    <div className="card py-6 text-center text-sm text-cs-muted">No department analytics available yet.</div>
                  ) : (
                    departmentBreakdown.map((department) => (
                      <div key={department.departmentId} className="card py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-cs-ink">{department.name}</span>
                          <span className={`text-xs font-bold ${department.resolutionRate >= 75 ? 'text-emerald-700' : department.resolutionRate >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                            {department.resolutionRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-cs-subtle rounded-full overflow-hidden border border-cs-border">
                          <div
                            className={`h-full rounded-full ${department.resolutionRate >= 75 ? 'bg-emerald-500' : department.resolutionRate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${department.resolutionRate}%` }}
                          />
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-cs-muted flex-wrap">
                          <span>{department.total} total</span>
                          <span>{department.resolved} resolved</span>
                          <span>{department.pending} pending</span>
                          <span>{department.inProgress} in progress</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-cs-accent" />
                  <span className="text-sm font-semibold text-cs-ink">Recent Monthly Trend</span>
                </div>
                <div className="card flex flex-col gap-3">
                  {monthlyTrend.map((month) => {
                    const resolutionRate = month.total ? Math.round((month.resolved / month.total) * 100) : 0;

                    return (
                      <div key={month.label} className="flex items-center gap-3">
                        <div className="w-20 flex-shrink-0">
                          <span className="text-xs text-cs-ink font-medium">{month.label}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-cs-muted">{month.total} filed</span>
                            <span className="text-xs text-cs-muted">{month.resolved} resolved</span>
                          </div>
                          <div className="w-full h-1.5 bg-cs-subtle rounded-full overflow-hidden">
                            <div
                              className={`${resolutionRate >= 75 ? 'bg-emerald-500' : resolutionRate >= 50 ? 'bg-amber-400' : 'bg-red-400'} h-full rounded-full`}
                              style={{ width: `${resolutionRate}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cs-ink">{resolutionRate}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
