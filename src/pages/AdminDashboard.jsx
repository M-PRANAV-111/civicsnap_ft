import { useState } from 'react';
import {
  Shield, Users, Flag, Plus, Eye, Check, X, BarChart2,
  CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight,
  ArrowRightLeft, Clock, MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const INITIAL_OFFICERS = [
  { id: 'OFF001', name: 'Suresh Kumar', dept: 'Municipal / GHMC', activeComplaints: 8, resolved: 45, status: 'Active' },
  { id: 'OFF002', name: 'Priya Reddy',  dept: 'Water Supply', activeComplaints: 3, resolved: 27, status: 'Active' },
  { id: 'OFF003', name: 'Amit Sharma',  dept: 'Electricity',  activeComplaints: 12, resolved: 61, status: 'Busy' },
  { id: 'OFF004', name: 'Kavitha V.',   dept: 'Traffic Police', activeComplaints: 0, resolved: 18, status: 'Flagged' },
];

const INITIAL_FLAGS = [
  {
    type: 'officer', id: 'FLAG01', name: 'Kavitha V.', detail: 'Traffic Police · 3 unresolved escalations',
    reason: 'Repeated delays in high-priority complaints', status: 'Flagged'
  },
  {
    type: 'citizen', id: 'FLAG02', name: 'Anonymous User #2847', detail: '3 duplicate complaints this week',
    reason: 'Suspected spam submissions', status: 'Active'
  },
];

const DEPT_STATS = [
  { dept: 'Municipal / GHMC', total: 42, resolved: 31, pending: 11, rate: 74 },
  { dept: 'Electricity',      total: 28, resolved: 19, pending: 9,  rate: 68 },
  { dept: 'Water Supply',     total: 35, resolved: 24, pending: 11, rate: 69 },
  { dept: 'Traffic Police',   total: 19, resolved: 14, pending: 5,  rate: 74 },
];

const DEPARTMENTS = [
  'Municipal / GHMC','Police','Traffic Police','Revenue','Endowments',
  'Water Supply','Electricity','Health','Education','Rural Development'
];

const STATUS_CONFIG = {
  Active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Busy:    'bg-amber-50 text-amber-700 border-amber-200',
  Flagged: 'bg-red-50 text-red-700 border-red-200',
  Suspended: 'bg-gray-100 text-gray-600 border-gray-300',
};

/** Toast notification */
function Toast({ message, type = 'success', onClose }) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'danger' ? XCircle : AlertTriangle;
  const color = type === 'success' ? 'text-emerald-400' : type === 'danger' ? 'text-red-400' : 'text-amber-400';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
        text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg whitespace-nowrap"
      style={{ background: 'var(--cs-ink)' }}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/** Officer detail modal */
function OfficerModal({ officer, onClose, onFlag, onUnflag }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border" style={{ borderColor: 'var(--cs-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--cs-ink)' }}>Officer Profile</h3>
          <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: 'rgba(29,78,216,0.08)', color: 'var(--cs-accent)' }}>
            {officer.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--cs-ink)' }}>{officer.name}</p>
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{officer.dept}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[officer.status]}`}>
              {officer.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Active Cases', value: officer.activeComplaints, color: '#B45309', bg: '#FFFBEB' },
            { label: 'Resolved',     value: officer.resolved,         color: '#065F46', bg: '#ECFDF5' },
            { label: 'Resolution Rate', value: `${Math.round((officer.resolved / (officer.resolved + officer.activeComplaints)) * 100)}%`, color: 'var(--cs-accent)', bg: '#EFF6FF' },
            { label: 'Efficiency',   value: officer.status === 'Busy' ? 'High Load' : 'Normal', color: 'var(--cs-ink)', bg: 'var(--cs-subtle)' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-xl p-3 text-center border" style={{ background: bg, borderColor: 'var(--cs-border)' }}>
              <p className="font-bold text-lg" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {officer.status === 'Flagged'
            ? <button onClick={() => { onUnflag(officer.id); onClose(); }} className="btn-success py-2.5 text-sm">
                <Check className="w-4 h-4" /> Clear Flag
              </button>
            : <button onClick={() => { onFlag(officer.id); onClose(); }} className="btn-danger py-2.5 text-sm">
                <Flag className="w-4 h-4" /> Flag Officer
              </button>
          }
          <button onClick={onClose} className="btn-secondary py-2.5 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { pendingTransfers, approveTransfer, rejectTransfer } = useApp();
  const [activeTab, setActiveTab]       = useState('overview');
  const [officers, setOfficers]         = useState(INITIAL_OFFICERS);
  const [flags, setFlags]               = useState(INITIAL_FLAGS);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOfficer, setNewOfficer]     = useState({ name: '', dept: '', email: '' });
  const [creating, setCreating]         = useState(false);
  const [toast, setToast]               = useState(null); // { message, type }
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateOfficer = async () => {
    if (!newOfficer.name || !newOfficer.dept || !newOfficer.email) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }
    setCreating(true);
    await new Promise(r => setTimeout(r, 800));
    const created = {
      id: `OFF${String(officers.length + 5).padStart(3,'0')}`,
      name: newOfficer.name,
      dept: newOfficer.dept,
      activeComplaints: 0,
      resolved: 0,
      status: 'Active',
    };
    setOfficers(prev => [...prev, created]);
    setNewOfficer({ name: '', dept: '', email: '' });
    setShowCreateForm(false);
    setCreating(false);
    showToast(`Officer "${created.name}" created successfully`);
  };

  const handleFlagOfficer = (id) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status: 'Flagged' } : o));
    const o = officers.find(x => x.id === id);
    setFlags(prev => {
      if (prev.find(f => f.id === id)) return prev;
      return [...prev, { type: 'officer', id, name: o?.name, detail: `${o?.dept}`, reason: 'Flagged by admin', status: 'Flagged' }];
    });
    showToast(`${officers.find(o => o.id === id)?.name} flagged`, 'warning');
  };

  const handleUnflagOfficer = (id) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status: 'Active' } : o));
    setFlags(prev => prev.filter(f => f.id !== id));
    showToast(`Flag cleared for officer`);
  };

  const handleSuspend = (id) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status: 'Suspended' } : o));
    setFlags(prev => prev.filter(f => f.id !== id));
    showToast(`Officer suspended`, 'danger');
  };

  const handleResolveFlag = (id) => {
    setFlags(prev => prev.filter(f => f.id !== id));
    showToast(`Flag resolved`);
  };

  const handleBlock = (id) => {
    setFlags(prev => prev.filter(f => f.id !== id));
    showToast(`User blocked`, 'danger');
  };

  const totalComplaints = DEPT_STATS.reduce((s, d) => s + d.total, 0);
  const totalResolved   = DEPT_STATS.reduce((s, d) => s + d.resolved, 0);

  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
          <span className="page-title">Admin Panel</span>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(29,78,216,0.08)', color: 'var(--cs-accent)' }}>
          Administrator
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 flex-shrink-0">
        {[
          { label: 'Total',    value: totalComplaints, icon: '📋' },
          { label: 'Pending',  value: totalComplaints - totalResolved, icon: '⏳' },
          { label: 'Resolved', value: totalResolved, icon: '✅' },
          { label: 'Officers', value: officers.length, icon: '👮' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card text-center py-3">
            <span className="text-lg">{icon}</span>
            <p className="text-base font-bold mt-1" style={{ color: 'var(--cs-ink)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
        {[
          { key: 'overview',   label: 'Overview',                                              icon: BarChart2 },
          { key: 'officers',   label: `Officers (${officers.length})`,                         icon: Users },
          { key: 'flagged',    label: `Flagged (${flags.length})`,                             icon: Flag },
          { key: 'transfers',  label: pendingTransfers.length > 0 ? `Transfers (${pendingTransfers.length})` : 'Transfers', icon: ArrowRightLeft },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all"
            style={activeTab === key
              ? { background: 'var(--cs-accent)', color: '#fff', borderColor: 'var(--cs-accent)' }
              : key === 'transfers' && pendingTransfers.length > 0
                ? { background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' }
                : { background: '#fff', color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="scrollable px-4 pb-4">
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cs-muted)' }}>
              Department Performance
            </p>
            {DEPT_STATS.map(d => (
              <div key={d.dept} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{d.dept}</span>
                  <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{d.total} complaints</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden border"
                    style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${d.rate}%`,
                      background: d.rate >= 70 ? '#10B981' : '#F59E0B'
                    }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: d.rate >= 70 ? '#065F46' : '#92400E' }}>
                    {d.rate}%
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span style={{ color: '#065F46' }}>✓ {d.resolved} resolved</span>
                  <span style={{ color: '#92400E' }}>⏳ {d.pending} pending</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── OFFICERS ── */}
        {activeTab === 'officers' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCreateForm(v => !v)}
              className="btn-primary py-3 text-sm"
              id="create-officer-btn"
            >
              <Plus className="w-4 h-4" />
              {showCreateForm ? 'Cancel' : 'Create Officer Account'}
            </button>

            {showCreateForm && (
              <div className="card flex flex-col gap-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>New Officer Details</p>
                <div>
                  <label className="label" htmlFor="new-name">Full Name</label>
                  <input id="new-name" className="input-field" placeholder="e.g. Ravi Teja"
                    value={newOfficer.name} onChange={e => setNewOfficer({ ...newOfficer, name: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="new-email">Email Address</label>
                  <input id="new-email" className="input-field" type="email" placeholder="officer@gov.in"
                    value={newOfficer.email} onChange={e => setNewOfficer({ ...newOfficer, email: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="new-dept">Department</label>
                  <select id="new-dept" className="input-field" value={newOfficer.dept}
                    onChange={e => setNewOfficer({ ...newOfficer, dept: e.target.value })}>
                    <option value="">-- Select Department --</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleCreateOfficer}
                  disabled={creating}
                  className="btn-primary py-3 text-sm disabled:opacity-50"
                  id="create-account-btn"
                >
                  {creating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    : <><Check className="w-4 h-4" /> Create Account</>}
                </button>
              </div>
            )}

            {officers.map(o => (
              <div key={o.id} className="card flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(29,78,216,0.08)', color: 'var(--cs-accent)' }}>
                  {o.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--cs-ink)' }}>{o.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[o.status]}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{o.dept}</p>
                  <div className="flex gap-3 text-xs mt-1">
                    <span style={{ color: '#B45309' }}>Active: {o.activeComplaints}</span>
                    <span style={{ color: '#065F46' }}>Resolved: {o.resolved}</span>
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={() => setSelectedOfficer(o)}
                      className="btn-secondary py-1.5 text-xs flex-1"
                      id={`view-${o.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {o.status !== 'Suspended' && (
                      o.status === 'Flagged'
                        ? <button onClick={() => handleUnflagOfficer(o.id)} className="btn-success py-1.5 text-xs flex-1"
                            id={`unflag-${o.id}`}>
                            <Check className="w-3.5 h-3.5" /> Unflag
                          </button>
                        : <button onClick={() => handleFlagOfficer(o.id)} className="btn-danger py-1.5 text-xs flex-1"
                            id={`flag-${o.id}`}>
                            <Flag className="w-3.5 h-3.5" /> Flag
                          </button>
                    )}
                    {o.status === 'Suspended' && (
                      <span className="btn-secondary py-1.5 text-xs flex-1 opacity-50 pointer-events-none">Suspended</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FLAGGED ── */}
        {activeTab === 'flagged' && (
          <div className="flex flex-col gap-4">
            {flags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(16,185,129,0.4)' }} />
                <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>No active flags. All clear!</p>
              </div>
            ) : (
              flags.map(f => (
                <div key={f.id} className="rounded-2xl p-4 border"
                  style={{
                    background: f.type === 'officer' ? '#FEF2F2' : '#FFFBEB',
                    borderColor: f.type === 'officer' ? '#FECACA' : '#FDE68A'
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Flag className="w-4 h-4" style={{ color: f.type === 'officer' ? '#EF4444' : '#F59E0B' }} />
                    <span className="text-sm font-semibold" style={{ color: f.type === 'officer' ? '#991B1B' : '#92400E' }}>
                      Flagged {f.type === 'officer' ? 'Officer' : 'Citizen'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--cs-ink)' }}>{f.name}</p>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--cs-muted)' }}>{f.detail}</p>
                  <p className="text-xs mb-3 italic" style={{ color: 'var(--cs-muted)' }}>Reason: {f.reason}</p>
                  <div className="flex gap-2">
                    {f.type === 'officer' ? (
                      <>
                        <button
                          onClick={() => { handleUnflagOfficer(f.id); handleResolveFlag(f.id); }}
                          className="btn-success py-2 text-xs flex-1"
                          id={`clear-${f.id}`}
                        >
                          <Check className="w-4 h-4" /> Clear Flag
                        </button>
                        <button
                          onClick={() => { handleSuspend(f.id); }}
                          className="btn-danger py-2 text-xs flex-1"
                          id={`suspend-${f.id}`}
                        >
                          <XCircle className="w-4 h-4" /> Suspend
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleResolveFlag(f.id)}
                          className="btn-secondary py-2 text-xs flex-1"
                          id={`review-${f.id}`}
                        >
                          <Eye className="w-4 h-4" /> Dismiss
                        </button>
                        <button
                          onClick={() => handleBlock(f.id)}
                          className="btn-danger py-2 text-xs flex-1"
                          id={`block-${f.id}`}
                        >
                          <XCircle className="w-4 h-4" /> Block User
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── TRANSFERS ── */}
        {activeTab === 'transfers' && (
          <div className="flex flex-col gap-4">
            {pendingTransfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ArrowRightLeft className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
                <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>No pending transfer requests.</p>
              </div>
            ) : (
              pendingTransfers.map(t => (
                <div key={t.id} className="rounded-2xl p-4 border"
                  style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-800">Pending Transfer</span>
                    <span className="ml-auto text-xs font-bold text-amber-700" style={{ background: '#FEF3C7', padding: '2px 8px', borderRadius: '99px' }}>
                      {t.complaintId}
                    </span>
                  </div>

                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--cs-ink)' }}>{t.description}</p>
                  <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--cs-muted)' }}>
                    <MapPin className="w-3 h-3" />
                    <span>{t.address}</span>
                    <span>·</span>
                    <span>By {t.citizenName}</span>
                  </div>

                  {/* From → To */}
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
                    style={{ background: '#FFF', border: '1px solid var(--cs-border)' }}>
                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--cs-muted)' }}>From</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--cs-ink)' }}>{t.fromDept}</p>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-center">
                      <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--cs-muted)' }}>To</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--cs-accent)' }}>{t.toDept}</p>
                    </div>
                  </div>

                  <p className="text-xs mb-3" style={{ color: 'var(--cs-muted)' }}>
                    Requested {new Date(t.requestedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { approveTransfer(t.id); }}
                      className="btn-success py-2.5 text-xs flex-1"
                      id={`approve-transfer-${t.id}`}
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Transfer
                    </button>
                    <button
                      onClick={() => { rejectTransfer(t.id); }}
                      className="btn-danger py-2.5 text-xs flex-1"
                      id={`reject-transfer-${t.id}`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Officer modal */}
      {selectedOfficer && (
        <OfficerModal
          officer={selectedOfficer}
          onClose={() => setSelectedOfficer(null)}
          onFlag={handleFlagOfficer}
          onUnflag={handleUnflagOfficer}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
