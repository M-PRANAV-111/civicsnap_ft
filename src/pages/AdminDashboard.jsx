import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Flag,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function extractList(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of preferredKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  for (const value of Object.values(payload || {})) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function normalizeComplaintRow(complaint) {
  return {
    id: String(pickFirst(complaint?._id, complaint?.id, complaint?.complaintId, 'N/A')),
    status: complaint?.status || 'Pending',
    category: pickFirst(complaint?.category, complaint?.department?.name, complaint?.departmentName, 'General'),
    department: pickFirst(complaint?.department?.name, complaint?.departmentName, complaint?.category, 'Unassigned'),
    citizen: pickFirst(complaint?.citizen?.name, complaint?.citizenId?.name, complaint?.citizenName, complaint?.user?.name, 'Citizen'),
    submittedAt: pickFirst(complaint?.createdAt, complaint?.submittedAt, complaint?.updatedAt, ''),
  };
}

function normalizeFlaggedRow(account) {
  return {
    id: String(pickFirst(account?._id, account?.id, account?.userId, account?.officerId, 'N/A')),
    name: pickFirst(account?.name, account?.user?.name, account?.officer?.name, account?.email, 'Unknown'),
    email: pickFirst(account?.email, account?.user?.email, account?.officer?.email, '-'),
    role: pickFirst(account?.role, account?.user?.role, account?.type, 'user'),
    reason: pickFirst(account?.reason, account?.flagReason, account?.message, account?.rejectionReason, 'Flagged by backend'),
    status: pickFirst(account?.status, account?.isFlagged ? 'Flagged' : '', 'Flagged'),
  };
}

function normalizeOfficerRow(officer, departmentName) {
  return {
    id: String(pickFirst(officer?._id, officer?.id, officer?.officerId, 'N/A')),
    name: pickFirst(officer?.name, officer?.fullName, 'Officer'),
    email: pickFirst(officer?.email, '-'),
    department: pickFirst(officer?.department?.name, officer?.departmentName, departmentName, 'Unassigned'),
  };
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Toast({ message, onClose }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
      style={{ background: 'var(--cs-ink)' }}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      <span>{message}</span>
      <button type="button" onClick={onClose} className="opacity-70 hover:opacity-100">
        x
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Icon className="w-8 h-8" style={{ color: 'rgba(75,85,99,0.3)' }} />
      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--cs-ink)' }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { apiFetch, departments, isAdminLoggedIn, refreshDepartments } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [complaints, setComplaints] = useState([]);
  const [flaggedAccounts, setFlaggedAccounts] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState('');
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [creatingOfficer, setCreatingOfficer] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [officerForm, setOfficerForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });

  const loadAdminData = async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [departmentPayload, complaintsPayload, flaggedPayload, officersPayload] = await Promise.all([
        refreshDepartments({ silent: true }),
        apiFetch('/api/admin/complaints', { requireAuth: true }),
        apiFetch('/api/admin/flagged', { requireAuth: true }),
        apiFetch('/api/admin/officers', { requireAuth: true }),
      ]);

      setComplaints(extractList(complaintsPayload, ['complaints', 'data']).map(normalizeComplaintRow));
      setFlaggedAccounts(extractList(flaggedPayload, ['flagged', 'accounts', 'data']).map(normalizeFlaggedRow));
      setOfficers(extractList(officersPayload, ['officers', 'data']).map((officer) => normalizeOfficerRow(officer)));

      if (Array.isArray(departmentPayload) && departmentPayload.length > 0) {
        // Context state is already updated by refreshDepartments.
      }
    } catch (error) {
      setLoadError(error.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    loadAdminData();
  }, [isAdminLoggedIn]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) return;

    setCreatingDepartment(true);
    try {
      await apiFetch('/api/admin/departments', {
        method: 'POST',
        body: {
          name: departmentName.trim(),
          departmentName: departmentName.trim(),
        },
        requireAuth: true,
      });
      setDepartmentName('');
      await refreshDepartments({ silent: true });
      showToast('Department created successfully.');
    } catch (error) {
      setLoadError(error.message || 'Unable to create department.');
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleCreateOfficer = async () => {
    if (!officerForm.name.trim() || !officerForm.email.trim() || !officerForm.password.trim() || !officerForm.department) {
      setLoadError('Please fill in all officer fields.');
      return;
    }

    const selectedDepartment = departments.find((department) => department._id === officerForm.department);

    setCreatingOfficer(true);
    try {
      const payload = await apiFetch('/api/admin/officers', {
        method: 'POST',
        body: {
          name: officerForm.name.trim(),
          email: officerForm.email.trim(),
          password: officerForm.password,
          department: officerForm.department,
          departmentId: officerForm.department,
          departmentName: selectedDepartment?.name || '',
        },
        requireAuth: true,
      });

      setOfficers((currentOfficers) => [
        normalizeOfficerRow(payload?.officer || payload?.user || payload, selectedDepartment?.name),
        ...currentOfficers.filter((officer) => officer.id !== String(payload?._id || payload?.id || payload?.officer?._id || payload?.user?._id || '')),
      ]);
      setOfficerForm({ name: '', email: '', password: '', department: '' });
      showToast('Officer created successfully.');
    } catch (error) {
      setLoadError(error.message || 'Unable to create officer.');
    } finally {
      setCreatingOfficer(false);
    }
  };

  const stats = [
    { label: 'Departments', value: departments.length, icon: Building2 },
    { label: 'Complaints', value: complaints.length, icon: ClipboardList },
    { label: 'Flagged', value: flaggedAccounts.length, icon: Flag },
    { label: 'Officers', value: officers.length, icon: UserPlus },
  ];

  if (!isAdminLoggedIn) {
    return (
      <div className="screen items-center justify-center gap-4 px-6" style={{ background: 'var(--cs-bg)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border"
          style={{ background: 'var(--cs-subtle)', borderColor: 'var(--cs-border)' }}
        >
          <AlertCircle className="w-7 h-7" style={{ color: 'var(--cs-muted)' }} />
        </div>
        <div className="text-center">
          <p className="font-medium" style={{ color: 'var(--cs-ink)' }}>Admin access required</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Please sign in with an admin account first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
          <span className="page-title">Admin Panel</span>
        </div>
        <button type="button" onClick={loadAdminData} className="btn-secondary w-auto px-3 py-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-3 flex-shrink-0">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card text-center py-3">
            <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center" style={{ background: 'var(--cs-subtle)' }}>
              <Icon className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
            </div>
            <p className="text-base font-bold mt-2" style={{ color: 'var(--cs-ink)' }}>{value}</p>
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 px-4 pb-3 flex-shrink-0">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'departments', label: 'Departments' },
          { key: 'officers', label: 'Officers' },
          { key: 'complaints', label: 'Complaints' },
          { key: 'flagged', label: 'Flagged' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all"
            style={
              activeTab === key
                ? { background: 'var(--cs-accent)', color: '#fff', borderColor: 'var(--cs-accent)' }
                : { background: '#fff', color: 'var(--cs-muted)', borderColor: 'var(--cs-border)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scrollable px-4 pb-4">
        {loadError && (
          <div className="rounded-xl border px-3 py-3 mb-4 flex items-start gap-2" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-500" />
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        )}

        {loading && activeTab === 'overview' ? (
          <EmptyState icon={Loader2} title="Loading admin data..." subtitle="Fetching departments, complaints, and flagged accounts." />
        ) : null}

        {activeTab === 'overview' && !loading && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>Recent Complaints</p>
              {complaints.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No complaints yet" subtitle="Admin complaints will appear here once the backend returns them." />
              ) : (
                <div className="flex flex-col gap-2">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div key={complaint.id} className="rounded-xl border px-3 py-3" style={{ borderColor: 'var(--cs-border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</span>
                        <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{complaint.status}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                        {complaint.category} · {complaint.department}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>Flagged Accounts</p>
              {flaggedAccounts.length === 0 ? (
                <EmptyState icon={Flag} title="No flagged accounts" subtitle="Backend flagged users and officers will appear here." />
              ) : (
                <div className="flex flex-col gap-2">
                  {flaggedAccounts.slice(0, 5).map((account) => (
                    <div key={account.id} className="rounded-xl border px-3 py-3" style={{ borderColor: 'var(--cs-border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{account.name}</span>
                        <span className="text-xs capitalize" style={{ color: '#B91C1C' }}>{account.role}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{account.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="flex flex-col gap-4">
            <div className="card flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>Create Department</p>
              <input
                className="input-field"
                placeholder="Department name"
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
              />
              <button type="button" onClick={handleCreateDepartment} disabled={creatingDepartment} className="btn-primary py-3 text-sm disabled:opacity-50">
                {creatingDepartment ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Department</>}
              </button>
            </div>

            <div className="card overflow-x-auto">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>Departments</p>
              {departments.length === 0 ? (
                <EmptyState icon={Building2} title="No departments loaded" subtitle="Use the button above to create one, or refresh from the backend." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department._id} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                        <td className="py-3" style={{ color: 'var(--cs-ink)' }}>{department.name}</td>
                        <td className="py-3 font-mono text-xs" style={{ color: 'var(--cs-muted)' }}>{department._id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'officers' && (
          <div className="flex flex-col gap-4">
            <div className="card flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>Create Officer</p>
              <input
                className="input-field"
                placeholder="Full name"
                value={officerForm.name}
                onChange={(event) => setOfficerForm({ ...officerForm, name: event.target.value })}
              />
              <input
                className="input-field"
                placeholder="Email"
                type="email"
                value={officerForm.email}
                onChange={(event) => setOfficerForm({ ...officerForm, email: event.target.value })}
              />
              <input
                className="input-field"
                placeholder="Password"
                type="password"
                value={officerForm.password}
                onChange={(event) => setOfficerForm({ ...officerForm, password: event.target.value })}
              />
              <select
                className="input-field"
                value={officerForm.department}
                onChange={(event) => setOfficerForm({ ...officerForm, department: event.target.value })}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleCreateOfficer} disabled={creatingOfficer} className="btn-primary py-3 text-sm disabled:opacity-50">
                {creatingOfficer ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4" /> Create Officer</>}
              </button>
            </div>

            <div className="card overflow-x-auto">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>All Officers</p>
              {officers.length === 0 ? (
                <EmptyState icon={UserPlus} title="No officers found" subtitle="Create an officer above or refresh once officer accounts exist." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((officer) => (
                      <tr key={`${officer.id}-${officer.email}`} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                        <td className="py-3" style={{ color: 'var(--cs-ink)' }}>{officer.name}</td>
                        <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{officer.email}</td>
                        <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{officer.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="card overflow-x-auto">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>All Complaints</p>
            {complaints.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No complaints returned" subtitle="Check the backend or refresh once data exists." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Citizen</th>
                    <th className="pb-2">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                      <td className="py-3 font-mono text-xs" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.status}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.category}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.department}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.citizen}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{formatDate(complaint.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'flagged' && (
          <div className="card overflow-x-auto">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>Flagged Accounts</p>
            {flaggedAccounts.length === 0 ? (
              <EmptyState icon={Flag} title="No flagged accounts" subtitle="The backend has not returned any flagged accounts." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedAccounts.map((account) => (
                    <tr key={`${account.id}-${account.email}`} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                      <td className="py-3" style={{ color: 'var(--cs-ink)' }}>{account.name}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{account.email}</td>
                      <td className="py-3 capitalize" style={{ color: 'var(--cs-muted)' }}>{account.role}</td>
                      <td className="py-3" style={{ color: '#B91C1C' }}>{account.status}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{account.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
