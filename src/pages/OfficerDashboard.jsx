import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  LogOut, CheckCircle2, XCircle, RotateCcw, ArrowRightLeft,
  ClipboardList, MapPin, AlertCircle, Shield, X, Loader2, Clock
} from 'lucide-react';

const PRIORITY_CONFIG = {
  Urgent: 'bg-red-50 text-red-700 border border-red-200',
  High: 'bg-amber-50 text-amber-700 border border-amber-200',
  Normal: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const DEPARTMENTS = [
  'Municipal / GHMC','Police','Traffic Police','Revenue',
  'Endowments','Water Supply','Electricity','Health','Education','Rural Development'
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Simple confirmation toast */
function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-cs-ink text-white
        text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-cs-slide-up whitespace-nowrap">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

/** Transfer modal */
function TransferModal({ complaint, onClose, onTransfer }) {
  const [dept, setDept] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!dept) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onTransfer(complaint.id, dept);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-cs-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-cs-border animate-cs-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-cs-ink text-base">Transfer Complaint</h3>
          <button onClick={onClose} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin approval notice */}
        <div className="flex items-start gap-2 rounded-xl px-3 py-3 mb-4"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Transfer requests require <strong>admin approval</strong> before the case moves departments.
            The complaint will be locked until then.
          </p>
        </div>

        <p className="text-cs-muted text-sm mb-4">
          Requesting transfer for <strong className="text-cs-accent">{complaint.id}</strong>.
        </p>
        <label className="label" htmlFor="transfer-dept">Target Department</label>
        <select
          id="transfer-dept"
          className="input-field mb-4"
          value={dept}
          onChange={e => setDept(e.target.value)}
        >
          <option value="">-- Choose department --</option>
          {DEPARTMENTS.filter(d => d !== complaint.category).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary py-2.5 text-sm">Cancel</button>
          <button
            onClick={handleTransfer}
            disabled={!dept || loading}
            className="btn-primary py-2.5 text-sm disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting…</>
              : <><ArrowRightLeft className="w-4 h-4" /> Request Transfer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfficerDashboard({ desktop }) {
  // Use shared context state — no local copy
  const {
    isOfficerLoggedIn, setIsOfficerLoggedIn,
    officerComplaints,
    updateOfficerComplaint,
    requestTransfer,
  } = useApp();

  const [activeTab, setActiveTab] = useState('pending');
  const [toast, setToast] = useState('');
  const [transferTarget, setTransferTarget] = useState(null);

  // Desktop mode: skip auth check
  if (!desktop && !isOfficerLoggedIn) {
    return (
      <div className="screen items-center justify-center gap-4 px-6" style={{ background: 'var(--cs-bg)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center border"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}>
          <AlertCircle className="w-7 h-7" style={{ color: 'var(--cs-muted)' }} />
        </div>
        <div className="text-center">
          <p className="font-medium" style={{ color: 'var(--cs-ink)' }}>Authentication required</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Please log in to access the officer dashboard</p>
        </div>
        <a href="/officer/login" className="btn-primary w-auto px-8">Login</a>
      </div>
    );
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateStatus = (id, newStatus) => {
    updateOfficerComplaint(id, { status: newStatus });
    const labels = { 'In Progress': 'Accepted', Resolved: 'Resolved', Rejected: 'Rejected' };
    showToast(`${id} marked as ${labels[newStatus] || newStatus}`);
  };

  const handleTransfer = (id, dept) => {
    requestTransfer(id, dept);
    showToast(`Transfer to ${dept} requested — awaiting admin approval`);
  };

  // Filter: Transfer Pending shown in its own bucket merged with in-progress view
  const filtered = officerComplaints.filter(c =>
    activeTab === 'pending'      ? c.status === 'Pending' :
    activeTab === 'inprogress'   ? (c.status === 'In Progress' || c.status === 'Transfer Pending') :
    ['Resolved', 'Rejected'].includes(c.status)
  );

  const transferPendingCount = officerComplaints.filter(c => c.status === 'Transfer Pending').length;

  const stats = [
    { label: 'Total',    count: officerComplaints.length,                                        color: 'var(--cs-ink)',  bg: '#FFFFFF' },
    { label: 'Pending',  count: officerComplaints.filter(c => c.status === 'Pending').length,    color: '#B45309',        bg: '#FFFBEB' },
    { label: 'Resolved', count: officerComplaints.filter(c => c.status === 'Resolved').length,   color: '#065F46',        bg: '#ECFDF5' },
  ];

  const Content = () => (
    <div className="flex flex-col h-full">
      {!desktop && (
        <div className="page-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
            <span className="page-title">Officer Dashboard</span>
          </div>
          <button
            onClick={() => { setIsOfficerLoggedIn(false); window.location.href = '/'; }}
            className="flex items-center gap-1.5 text-red-600 text-sm font-medium"
            id="officer-logout"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 flex-shrink-0">
        {stats.map(({ label, count, color, bg }) => (
          <div key={label} className="flex-1 rounded-xl py-3 text-center border shadow-card"
            style={{ background: bg, borderColor: 'var(--cs-border)' }}>
            <p className="text-xl font-bold" style={{ color }}>{count}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
        {[
          { key: 'pending',    label: 'Pending' },
          { key: 'inprogress', label: transferPendingCount > 0 ? `In Progress / Transfer (${transferPendingCount})` : 'In Progress' },
          { key: 'done',       label: 'Done' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === key
                ? 'text-white border-0'
                : 'border text-cs-muted hover:text-cs-ink'
            }`}
            style={activeTab === key
              ? { background: 'var(--cs-accent)', borderColor: 'var(--cs-accent)' }
              : { background: '#FFFFFF', borderColor: 'var(--cs-border)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
            <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>No complaints in this category</p>
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="card flex flex-col gap-3 animate-cs-slide-up">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--cs-accent)' }}>{c.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.Normal}`}>
                      {c.priority || 'Normal'}
                    </span>
                    {c.status === 'Transfer Pending' && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Awaiting Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--cs-ink)' }}>{c.description}</p>
                  <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                    <MapPin className="w-3 h-3" /> <span>{c.address}</span>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="flex items-center gap-2 text-xs border-t pt-2.5" style={{ color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }}>
                <span>By {c.citizenName}</span>
                <span>·</span>
                <span>{formatDate(c.submittedAt)}</span>
                <span>·</span>
                <span>{c.category}</span>
                {c.status === 'Transfer Pending' && (
                  <>
                    <span>·</span>
                    <span className="text-orange-600 font-medium">→ {c.pendingToDept}</span>
                  </>
                )}
              </div>

              {/* Transfer pending: locked state */}
              {c.status === 'Transfer Pending' && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Transfer to <strong>{c.pendingToDept}</strong> is pending admin approval. Actions locked.
                  </p>
                </div>
              )}

              {c.status === 'Pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus(c.id, 'In Progress')} className="btn-secondary py-2 text-xs">
                    <RotateCcw className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={() => updateStatus(c.id, 'Rejected')} className="btn-danger py-2 text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => setTransferTarget(c)} className="btn-secondary py-2 text-xs col-span-2">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer to Another Dept.
                  </button>
                </div>
              )}

              {c.status === 'In Progress' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => updateStatus(c.id, 'Resolved')} className="btn-success py-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                  <button onClick={() => updateStatus(c.id, 'Rejected')} className="btn-danger py-2 text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => setTransferTarget(c)} className="btn-secondary py-2 text-xs col-span-2">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                  </button>
                </div>
              )}

              {(c.status === 'Resolved' || c.status === 'Rejected') && (
                <div className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2"
                  style={{ background: 'var(--cs-subtle)', color: 'var(--cs-muted)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Closed — no further action required</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Transfer Modal */}
      {transferTarget && (
        <TransferModal
          complaint={transferTarget}
          onClose={() => setTransferTarget(null)}
          onTransfer={handleTransfer}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );

  if (desktop) return <Content />;
  return <div className="screen" style={{ background: 'var(--cs-bg)' }}><Content /></div>;
}
