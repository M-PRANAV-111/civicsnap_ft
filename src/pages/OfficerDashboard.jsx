import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LogOut,
  Shield,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';

function Toast({ message, type = 'success', onClose }) {
  const accentColor = type === 'error' ? '#DC2626' : '#059669';

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
      style={{ background: 'var(--cs-ink)' }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
      <span>{message}</span>
      <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border"
        style={{ borderColor: 'var(--cs-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--cs-ink)' }}>{title}</h3>
          <button type="button" onClick={onClose} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RejectModal({ complaint, loading, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <ModalShell title="Reject Complaint" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: 'var(--cs-muted)' }}>
        Add a clear rejection reason for <strong>{complaint.id}</strong>.
      </p>
      <textarea
        className="input-field resize-none"
        rows={4}
        placeholder="Explain why this complaint is being rejected..."
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim() || loading}
          className="btn-danger py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><XCircle className="w-4 h-4" /> Reject</>}
        </button>
      </div>
    </ModalShell>
  );
}

function ResolveModal({ complaint, loading, onClose, onConfirm }) {
  const [file, setFile] = useState(null);

  return (
    <ModalShell title="Resolve Complaint" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: 'var(--cs-muted)' }}>
        Upload an optional proof image before resolving <strong>{complaint.id}</strong>.
      </p>
      <label className="cursor-pointer block">
        <div className="border-2 border-dashed border-cs-border rounded-xl h-28 flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-cs-subtle transition-all">
          <Upload className="w-6 h-6 text-cs-muted/40" />
          <p className="text-cs-muted text-sm">{file ? file.name : 'Tap to upload proof image'}</p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(file)}
          disabled={loading}
          className="btn-success py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Resolve</>}
        </button>
      </div>
    </ModalShell>
  );
}

function TransferModal({ complaint, departments, loading, onClose, onConfirm }) {
  const [departmentId, setDepartmentId] = useState('');

  return (
    <ModalShell title="Transfer Complaint" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: 'var(--cs-muted)' }}>
        Move <strong>{complaint.id}</strong> to another department.
      </p>
      <select className="input-field" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
        <option value="">Select target department</option>
        {departments
          .filter((department) => department._id !== complaint.departmentId)
          .map((department) => (
            <option key={department._id} value={department._id}>
              {department.name}
            </option>
          ))}
      </select>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(departmentId)}
          disabled={!departmentId || loading}
          className="btn-primary py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Moving...</> : <><ArrowRightLeft className="w-4 h-4" /> Transfer</>}
        </button>
      </div>
    </ModalShell>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function OfficerDashboard({ desktop = false }) {
  const {
    authUser,
    departments,
    fetchOfficerComplaints,
    isOfficerLoggedIn,
    logoutDesktop,
    officerAccept,
    officerComplaints,
    officerComplaintsLoaded,
    officerReject,
    officerResolve,
    officerTransfer,
  } = useApp();

  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const [actionState, setActionState] = useState({ type: null, complaint: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [busyComplaintId, setBusyComplaintId] = useState('');

  const loadOfficerData = async () => {
    setLoading(true);
    setLoadError('');

    try {
      await fetchOfficerComplaints();
    } catch (error) {
      setLoadError(error.message || 'Unable to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOfficerLoggedIn) return;

    if (!officerComplaintsLoaded) {
      loadOfficerData();
    }
  }, [isOfficerLoggedIn, officerComplaintsLoaded]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = [
    { label: 'Total', count: officerComplaints.length, color: 'var(--cs-ink)', bg: '#FFFFFF' },
    { label: 'Pending', count: officerComplaints.filter((complaint) => complaint.status === 'Pending').length, color: '#B45309', bg: '#FFFBEB' },
    { label: 'Resolved', count: officerComplaints.filter((complaint) => complaint.status === 'Resolved').length, color: '#065F46', bg: '#ECFDF5' },
  ];

  const filteredComplaints =
    activeTab === 'pending'
      ? officerComplaints.filter((complaint) => complaint.status === 'Pending')
      : activeTab === 'inprogress'
      ? officerComplaints.filter((complaint) => complaint.status === 'In Progress')
      : officerComplaints.filter((complaint) => ['Resolved', 'Rejected'].includes(complaint.status));

  const handleLogout = () => {
    logoutDesktop();
    window.location.assign(desktop ? '/login' : '/officer/login');
  };

  const runAction = async (complaintId, task, successMessage) => {
    setBusyComplaintId(complaintId);
    setActionLoading(true);

    try {
      await task();
      setActionState({ type: null, complaint: null });
      showToast(successMessage);
    } catch (error) {
      showToast(error.message || 'Action failed.', 'error');
    } finally {
      setBusyComplaintId('');
      setActionLoading(false);
    }
  };

  if (!desktop && !isOfficerLoggedIn) {
    return (
      <div className="screen items-center justify-center gap-4 px-6" style={{ background: 'var(--cs-bg)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
        >
          <AlertCircle className="w-7 h-7" style={{ color: 'var(--cs-muted)' }} />
        </div>
        <div className="text-center">
          <p className="font-medium" style={{ color: 'var(--cs-ink)' }}>Authentication required</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Please log in to access the officer dashboard.</p>
        </div>
        <a href="/officer/login" className="btn-primary w-auto px-8">Login</a>
      </div>
    );
  }

  return (
    <div className={desktop ? 'h-full' : 'screen'} style={{ background: 'var(--cs-bg)' }}>
      <div className="flex flex-col h-full">
        {!desktop && (
          <div className="page-header flex-shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
              <span className="page-title">Officer Dashboard</span>
            </div>
            <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}

        {(authUser?.flagged || authUser?.isFlagged || authUser?.status === 'flagged') && (
          <div className="mx-4 mt-4 rounded-xl border px-3 py-3 flex items-start gap-2" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">
              This account has been flagged by the backend. Review your recent rejections before continuing.
            </p>
          </div>
        )}

        <div className="flex gap-3 px-4 py-3 flex-shrink-0">
          {stats.map(({ label, count, color, bg }) => (
            <div key={label} className="flex-1 rounded-xl py-3 text-center border shadow-card" style={{ background: bg, borderColor: 'var(--cs-border)' }}>
              <p className="text-xl font-bold" style={{ color }}>{count}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cs-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'inprogress', label: 'In Progress' },
            { key: 'done', label: 'Done' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border"
              style={
                activeTab === key
                  ? { background: 'var(--cs-accent)', color: '#fff', borderColor: 'var(--cs-accent)' }
                  : { background: '#FFFFFF', color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cs-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>Loading assigned complaints...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--cs-ink)' }}>Could not load complaints</p>
                <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{loadError}</p>
              </div>
              <button type="button" onClick={loadOfficerData} className="btn-secondary w-auto px-6">
                Retry
              </button>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ClipboardList className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>No complaints in this category</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => {
              const isBusy = busyComplaintId === complaint.id;

              return (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onClick={() => {}}
                  footer={
                    <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--cs-muted)' }}>
                      <span>By {complaint.citizenName}</span>
                      <span>&bull;</span>
                      <span>{formatDate(complaint.submittedAt)}</span>
                      <span>&bull;</span>
                      <span>{complaint.departmentName || complaint.category}</span>
                    </div>
                  }
                  actions={
                    complaint.status === 'Pending' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => runAction(complaint.id, () => officerAccept(complaint.id), `${complaint.id} accepted`)} disabled={isBusy} className="btn-secondary py-2 text-xs disabled:opacity-50">
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Accept
                        </button>
                        <button type="button" onClick={() => setActionState({ type: 'reject', complaint })} disabled={isBusy} className="btn-danger py-2 text-xs disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button type="button" onClick={() => setActionState({ type: 'transfer', complaint })} disabled={isBusy} className="btn-primary py-2 text-xs disabled:opacity-50">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                        </button>
                      </div>
                    ) : complaint.status === 'In Progress' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setActionState({ type: 'resolve', complaint })} disabled={isBusy} className="btn-success py-2 text-xs disabled:opacity-50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                        <button type="button" onClick={() => setActionState({ type: 'reject', complaint })} disabled={isBusy} className="btn-danger py-2 text-xs disabled:opacity-50">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button type="button" onClick={() => setActionState({ type: 'transfer', complaint })} disabled={isBusy} className="btn-primary py-2 text-xs disabled:opacity-50">
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--cs-subtle)' }}>
                        <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--cs-muted)' }} />
                        <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>
                          Closed - no further action required.
                        </p>
                      </div>
                    )
                  }
                />
              );
            })
          )}
        </div>
      </div>

      {actionState.type === 'reject' && actionState.complaint && (
        <RejectModal
          complaint={actionState.complaint}
          loading={actionLoading}
          onClose={() => setActionState({ type: null, complaint: null })}
          onConfirm={(reason) =>
            runAction(
              actionState.complaint.id,
              () => officerReject(actionState.complaint.id, reason),
              `${actionState.complaint.id} rejected`,
            )
          }
        />
      )}

      {actionState.type === 'resolve' && actionState.complaint && (
        <ResolveModal
          complaint={actionState.complaint}
          loading={actionLoading}
          onClose={() => setActionState({ type: null, complaint: null })}
          onConfirm={(file) =>
            runAction(
              actionState.complaint.id,
              () => officerResolve(actionState.complaint.id, file),
              `${actionState.complaint.id} resolved`,
            )
          }
        />
      )}

      {actionState.type === 'transfer' && actionState.complaint && (
        <TransferModal
          complaint={actionState.complaint}
          departments={departments}
          loading={actionLoading}
          onClose={() => setActionState({ type: null, complaint: null })}
          onConfirm={(departmentId) =>
            runAction(
              actionState.complaint.id,
              () => officerTransfer(actionState.complaint.id, departmentId),
              `${actionState.complaint.id} transferred`,
            )
          }
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
