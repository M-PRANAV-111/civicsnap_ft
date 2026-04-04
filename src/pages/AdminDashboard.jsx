import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { formatLocalizedDateTime, translateRole, translateStatus } from '../utils/i18nHelpers.js';

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
  const { t, i18n } = useTranslation();
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
      setLoadError(error.message || t('adminDashboard.errors.loadFailed'));
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
      showToast(t('adminDashboard.toasts.departmentCreated'));
    } catch (error) {
      setLoadError(error.message || t('adminDashboard.errors.departmentCreateFailed'));
    } finally {
      setCreatingDepartment(false);
    }
  };

  const handleCreateOfficer = async () => {
    if (!officerForm.name.trim() || !officerForm.email.trim() || !officerForm.password.trim() || !officerForm.department) {
      setLoadError(t('adminDashboard.errors.fillOfficerFields'));
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
      showToast(t('adminDashboard.toasts.officerCreated'));
    } catch (error) {
      setLoadError(error.message || t('adminDashboard.errors.officerCreateFailed'));
    } finally {
      setCreatingOfficer(false);
    }
  };

  const stats = [
    { label: t('adminDashboard.stats.departments'), value: departments.length, icon: Building2 },
    { label: t('adminDashboard.stats.complaints'), value: complaints.length, icon: ClipboardList },
    { label: t('adminDashboard.stats.flagged'), value: flaggedAccounts.length, icon: Flag },
    { label: t('adminDashboard.stats.officers'), value: officers.length, icon: UserPlus },
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
          <p className="font-medium" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.authRequiredTitle')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>{t('adminDashboard.authRequiredBody')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ background: 'var(--cs-bg)' }}>
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--cs-accent)' }} />
          <span className="page-title">{t('adminDashboard.title')}</span>
        </div>
        <button type="button" onClick={loadAdminData} className="btn-secondary w-auto px-3 py-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
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
          { key: 'overview', label: t('adminDashboard.tabs.overview') },
          { key: 'departments', label: t('adminDashboard.tabs.departments') },
          { key: 'officers', label: t('adminDashboard.tabs.officers') },
          { key: 'complaints', label: t('adminDashboard.tabs.complaints') },
          { key: 'flagged', label: t('adminDashboard.tabs.flagged') },
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
          <EmptyState icon={Loader2} title={t('adminDashboard.loadingTitle')} subtitle={t('adminDashboard.loadingSubtitle')} />
        ) : null}

        {activeTab === 'overview' && !loading && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>{t('adminDashboard.recentComplaints')}</p>
              {complaints.length === 0 ? (
                <EmptyState icon={ClipboardList} title={t('adminDashboard.emptyComplaintsTitle')} subtitle={t('adminDashboard.emptyComplaintsSubtitle')} />
              ) : (
                <div className="flex flex-col gap-2">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div key={complaint.id} className="rounded-xl border px-3 py-3" style={{ borderColor: 'var(--cs-border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</span>
                        <span className="text-xs" style={{ color: 'var(--cs-muted)' }}>{translateStatus(t, complaint.status)}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>
                        {complaint.category} - {complaint.department}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--cs-muted)' }}>{t('adminDashboard.flaggedAccounts')}</p>
              {flaggedAccounts.length === 0 ? (
                <EmptyState icon={Flag} title={t('adminDashboard.emptyFlaggedTitle')} subtitle={t('adminDashboard.emptyFlaggedSubtitle')} />
              ) : (
                <div className="flex flex-col gap-2">
                  {flaggedAccounts.slice(0, 5).map((account) => (
                    <div key={account.id} className="rounded-xl border px-3 py-3" style={{ borderColor: 'var(--cs-border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{account.name}</span>
                        <span className="text-xs capitalize" style={{ color: '#B91C1C' }}>{translateRole(t, account.role)}</span>
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
              <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.createDepartment')}</p>
              <input
                className="input-field"
                placeholder={t('adminDashboard.departmentNamePlaceholder')}
                value={departmentName}
                onChange={(event) => setDepartmentName(event.target.value)}
              />
              <button type="button" onClick={handleCreateDepartment} disabled={creatingDepartment} className="btn-primary py-3 text-sm disabled:opacity-50">
                {creatingDepartment ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.creating')}</> : <><Plus className="w-4 h-4" /> {t('adminDashboard.createDepartmentButton')}</>}
              </button>
            </div>

            <div className="card overflow-x-auto">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.departmentsList')}</p>
              {departments.length === 0 ? (
                <EmptyState icon={Building2} title={t('adminDashboard.emptyDepartmentsTitle')} subtitle={t('adminDashboard.emptyDepartmentsSubtitle')} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                      <th className="pb-2">{t('adminDashboard.table.name')}</th>
                      <th className="pb-2">{t('adminDashboard.table.id')}</th>
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
              <p className="text-sm font-semibold" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.createOfficer')}</p>
              <input
                className="input-field"
                placeholder={t('common.enterFullName')}
                value={officerForm.name}
                onChange={(event) => setOfficerForm({ ...officerForm, name: event.target.value })}
              />
              <input
                className="input-field"
                placeholder={t('common.email')}
                type="email"
                value={officerForm.email}
                onChange={(event) => setOfficerForm({ ...officerForm, email: event.target.value })}
              />
              <input
                className="input-field"
                placeholder={t('common.password')}
                type="password"
                value={officerForm.password}
                onChange={(event) => setOfficerForm({ ...officerForm, password: event.target.value })}
              />
              <select
                className="input-field"
                value={officerForm.department}
                onChange={(event) => setOfficerForm({ ...officerForm, department: event.target.value })}
              >
                <option value="">{t('adminDashboard.selectDepartment')}</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleCreateOfficer} disabled={creatingOfficer} className="btn-primary py-3 text-sm disabled:opacity-50">
                {creatingOfficer ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('common.creating')}</> : <><UserPlus className="w-4 h-4" /> {t('adminDashboard.createOfficerButton')}</>}
              </button>
            </div>

            <div className="card overflow-x-auto">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.allOfficers')}</p>
              {officers.length === 0 ? (
                <EmptyState icon={UserPlus} title={t('adminDashboard.emptyOfficersTitle')} subtitle={t('adminDashboard.emptyOfficersSubtitle')} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                      <th className="pb-2">{t('adminDashboard.table.name')}</th>
                      <th className="pb-2">{t('adminDashboard.table.email')}</th>
                      <th className="pb-2">{t('adminDashboard.table.department')}</th>
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
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.allComplaints')}</p>
            {complaints.length === 0 ? (
              <EmptyState icon={ClipboardList} title={t('adminDashboard.emptyComplaintsReturnedTitle')} subtitle={t('adminDashboard.emptyComplaintsReturnedSubtitle')} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                    <th className="pb-2">{t('adminDashboard.table.id')}</th>
                    <th className="pb-2">{t('adminDashboard.table.status')}</th>
                    <th className="pb-2">{t('adminDashboard.table.category')}</th>
                    <th className="pb-2">{t('adminDashboard.table.department')}</th>
                    <th className="pb-2">{t('adminDashboard.table.citizen')}</th>
                    <th className="pb-2">{t('adminDashboard.table.submitted')}</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                      <td className="py-3 font-mono text-xs" style={{ color: 'var(--cs-ink)' }}>{complaint.id}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{translateStatus(t, complaint.status)}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.category}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.department}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{complaint.citizen}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>
                        {formatLocalizedDateTime(complaint.submittedAt, i18n, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'flagged' && (
          <div className="card overflow-x-auto">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cs-ink)' }}>{t('adminDashboard.flaggedAccounts')}</p>
            {flaggedAccounts.length === 0 ? (
              <EmptyState icon={Flag} title={t('adminDashboard.emptyFlaggedTitle')} subtitle={t('adminDashboard.emptyFlaggedBackendSubtitle')} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--cs-muted)' }}>
                    <th className="pb-2">{t('adminDashboard.table.name')}</th>
                    <th className="pb-2">{t('adminDashboard.table.email')}</th>
                    <th className="pb-2">{t('adminDashboard.table.role')}</th>
                    <th className="pb-2">{t('adminDashboard.table.status')}</th>
                    <th className="pb-2">{t('adminDashboard.table.reason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedAccounts.map((account) => (
                    <tr key={`${account.id}-${account.email}`} className="border-t" style={{ borderColor: 'var(--cs-border)' }}>
                      <td className="py-3" style={{ color: 'var(--cs-ink)' }}>{account.name}</td>
                      <td className="py-3" style={{ color: 'var(--cs-muted)' }}>{account.email}</td>
                      <td className="py-3 capitalize" style={{ color: 'var(--cs-muted)' }}>{translateRole(t, account.role)}</td>
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
