import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { BarChart2, Menu, TrendingUp, MapPin, Activity, ArrowUpRight } from 'lucide-react';

const DISTRICT_DATA = [
  { name: 'Hyderabad', complaints: 145, resolved: 112, rate: 77 },
  { name: 'Rangareddy', complaints: 98, resolved: 71, rate: 72 },
  { name: 'Medchal', complaints: 87, resolved: 58, rate: 67 },
  { name: 'Sangareddy', complaints: 63, resolved: 51, rate: 81 },
  { name: 'Vikarabad', complaints: 41, resolved: 29, rate: 71 },
  { name: 'Mbnagar', complaints: 55, resolved: 38, rate: 69 },
];

const CATEGORY_STATS = [
  { cat: 'Municipal / GHMC', icon: '🏙️', count: 89, color: 'bg-orange-400' },
  { cat: 'Water Supply', icon: '💧', count: 67, color: 'bg-cyan-400' },
  { cat: 'Electricity', icon: '⚡', count: 54, color: 'bg-amber-400' },
  { cat: 'Traffic Police', icon: '🚦', count: 43, color: 'bg-yellow-500' },
  { cat: 'Health', icon: '🏥', count: 38, color: 'bg-red-400' },
  { cat: 'Education', icon: '🎓', count: 29, color: 'bg-green-500' },
];

const maxCount = Math.max(...CATEGORY_STATS.map((c) => c.count));
const totalComplaints = DISTRICT_DATA.reduce((s, d) => s + d.complaints, 0);
const totalResolved = DISTRICT_DATA.reduce((s, d) => s + d.resolved, 0);
const avgRate = Math.round(DISTRICT_DATA.reduce((s, d) => s + d.rate, 0) / DISTRICT_DATA.length);

function HeatCell({ rate, name }) {
  const bg = rate >= 80 ? 'bg-emerald-400' : rate >= 70 ? 'bg-emerald-300' : rate >= 60 ? 'bg-amber-300' : 'bg-red-300';
  return (
    <div className={`w-full h-full rounded-lg ${bg} flex items-center justify-center opacity-90`}>
      <span className="text-white text-xs font-bold drop-shadow">{rate}%</span>
    </div>
  );
}

export default function HeatmapScreen() {
  const { setSidebarOpen } = useApp();

  return (
    <div className="screen bg-cs-bg">
      <div className="page-header">
        <button onClick={() => setSidebarOpen(true)} className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl">
          <Menu className="w-4 h-4" />
        </button>
        <span className="page-title">Analytics</span>
        <div className="w-9" />
      </div>

      <div className="scrollable">
        <div className="px-4 py-4 flex flex-col gap-5 bottom-safe">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total', value: totalComplaints, icon: Activity, color: 'text-cs-ink', bg: 'bg-cs-card' },
              { label: 'Resolved', value: totalResolved, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Avg Rate', value: `${avgRate}%`, icon: BarChart2, color: 'text-cs-accent', bg: 'bg-blue-50', border: 'border-blue-100' },
            ].map(({ label, value, icon: Icon, color, bg, border = 'border-cs-border' }) => (
              <div key={label} className={`rounded-2xl p-4 text-center border shadow-card flex flex-col items-center gap-1 ${bg} ${border}`}>
                <Icon className={`w-4 h-4 ${color}`} />
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-cs-muted text-xs">{label}</p>
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">District Resolution Heatmap</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-xs text-cs-muted">
              {[
                { color: 'bg-emerald-400', label: '80%+' },
                { color: 'bg-emerald-300', label: '70%+' },
                { color: 'bg-amber-300', label: '60%+' },
                { color: 'bg-red-300', label: '<60%' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />{label}
                </div>
              ))}
            </div>
            <div className="card p-3">
              <div className="grid grid-cols-3 gap-2" style={{ minHeight: '110px' }}>
                {DISTRICT_DATA.map((d) => (
                  <div key={d.name} className="flex flex-col gap-1">
                    <div className="h-11">
                      <HeatCell rate={d.rate} name={d.name} />
                    </div>
                    <p className="text-cs-muted text-xs text-center truncate">{d.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* District table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-cs-ink">District Breakdown</span>
              <span className="text-xs text-cs-muted">Resolution Rate</span>
            </div>
            <div className="flex flex-col gap-2">
              {DISTRICT_DATA.sort((a, b) => b.rate - a.rate).map((d) => (
                <div key={d.name} className="card py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-cs-ink">{d.name}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold ${d.rate >= 75 ? 'text-emerald-700' : d.rate >= 65 ? 'text-amber-700' : 'text-red-700'}`}>
                        {d.rate}%
                      </span>
                      <ArrowUpRight className={`w-3 h-3 ${d.rate >= 75 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-cs-subtle rounded-full overflow-hidden border border-cs-border">
                    <div
                      className={`h-full rounded-full ${d.rate >= 75 ? 'bg-emerald-500' : d.rate >= 65 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs text-cs-muted">
                    <span>{d.complaints} total</span>
                    <span>{d.resolved} resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department chart */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-cs-accent" />
              <span className="text-sm font-semibold text-cs-ink">By Department</span>
            </div>
            <div className="card flex flex-col gap-3">
              {CATEGORY_STATS.map((c) => (
                <div key={c.cat} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center flex-shrink-0">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-cs-ink truncate">{c.cat}</span>
                      <span className="text-xs text-cs-muted flex-shrink-0 ml-2">{c.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-cs-subtle rounded-full overflow-hidden">
                      <div className={`h-full ${c.color} rounded-full`} style={{ width: `${(c.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
