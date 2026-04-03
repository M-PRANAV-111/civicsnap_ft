import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

const MOCK_COMPLAINTS = [
  {
    id: 'CS001', image: null,
    description: 'Large pothole near bus stop causing accidents',
    category: 'Municipal / GHMC', location: { lat: 17.385, lng: 78.4867 },
    address: 'Ameerpet, Hyderabad', status: 'In Progress',
    submittedAt: '2026-03-28T10:30:00Z', updatedAt: '2026-03-30T14:00:00Z',
    timeline: [
      { status: 'Pending', time: '2026-03-28T10:30:00Z', note: 'Complaint submitted' },
      { status: 'In Progress', time: '2026-03-30T14:00:00Z', note: 'Officer assigned and investigating' },
    ],
  },
  {
    id: 'CS002', image: null,
    description: 'Broken street light on main road',
    category: 'Electricity', location: { lat: 17.39, lng: 78.49 },
    address: 'Banjara Hills, Hyderabad', status: 'Resolved',
    submittedAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-25T11:00:00Z',
    resolutionProof: null,
    timeline: [
      { status: 'Pending', time: '2026-03-20T09:00:00Z', note: 'Complaint submitted' },
      { status: 'In Progress', time: '2026-03-22T10:00:00Z', note: 'Electrician dispatched' },
      { status: 'Resolved', time: '2026-03-25T11:00:00Z', note: 'Street light replaced and functional' },
    ],
  },
  {
    id: 'CS003', image: null,
    description: 'Garbage not collected for 5 days',
    category: 'Municipal / GHMC', location: { lat: 17.36, lng: 78.47 },
    address: 'Kukatpally, Hyderabad', status: 'Rejected',
    rejectionReason: 'Area covered by private contractor, not within GHMC jurisdiction',
    submittedAt: '2026-03-15T08:00:00Z', updatedAt: '2026-03-17T09:00:00Z',
    timeline: [
      { status: 'Pending', time: '2026-03-15T08:00:00Z', note: 'Complaint submitted' },
      { status: 'Rejected', time: '2026-03-17T09:00:00Z', note: 'Outside jurisdiction' },
    ],
  },
  {
    id: 'CS004', image: null,
    description: 'Water supply disruption for 3 days',
    category: 'Water Supply', location: { lat: 17.42, lng: 78.45 },
    address: 'Secunderabad, Hyderabad', status: 'Pending',
    submittedAt: '2026-04-01T07:00:00Z', updatedAt: '2026-04-01T07:00:00Z',
    timeline: [{ status: 'Pending', time: '2026-04-01T07:00:00Z', note: 'Complaint submitted' }],
  },
];

const MOCK_OFFICER_COMPLAINTS = [
  {
    id: 'CS005', description: 'Illegal parking blocking fire exit',
    category: 'Traffic Police', address: 'Jubilee Hills, Hyderabad',
    status: 'Pending', submittedAt: '2026-04-01T12:00:00Z',
    citizenName: 'Rajesh K.', priority: 'High',
  },
  {
    id: 'CS006', description: 'Open manhole near school',
    category: 'Municipal / GHMC', address: 'Dilsukhnagar, Hyderabad',
    status: 'Pending', submittedAt: '2026-04-02T08:00:00Z',
    citizenName: 'Sunita V.', priority: 'Urgent',
  },
  {
    id: 'CS007', description: 'Overhead cable hanging dangerously low',
    category: 'Electricity', address: 'LB Nagar, Hyderabad',
    status: 'In Progress', submittedAt: '2026-03-30T09:00:00Z',
    citizenName: 'Mohan R.', priority: 'High',
  },
];

// Detect mobile: true if viewport width < 768px
export function isMobileDevice() {
  return window.innerWidth < 768;
}

export function AppProvider({ children }) {
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  // Officer complaints now live in shared state so transfers are visible across views
  const [officerComplaints, setOfficerComplaints] = useState(MOCK_OFFICER_COMPLAINTS);
  const [capturedImage, setCapturedImage] = useState(null);

  // Pending transfer requests: { id, complaintId, fromDept, toDept, requestedAt, description }
  const [pendingTransfers, setPendingTransfers] = useState([]);

  // Desktop auth state (officer/admin/citizen login on desktop)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null); // { name, role, dept }

  // Role-specific flags
  const [isOfficerLoggedIn, setIsOfficerLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isCitizenLoggedIn, setIsCitizenLoggedIn] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user] = useState({ name: 'Guest Citizen', totalComplaints: 4, validComplaints: 3 });

  const addComplaint = (complaint) => {
    const newComplaint = {
      id: `CS${String(complaints.length + 5).padStart(3, '0')}`,
      ...complaint,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ status: 'Pending', time: new Date().toISOString(), note: 'Complaint submitted' }],
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    return newComplaint.id;
  };

  /** Officer updates a complaint's status (accept/reject/resolve) */
  const updateOfficerComplaint = (id, changes) => {
    setOfficerComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c)
    );
  };

  /**
   * Officer requests a transfer to another department.
   * Sets status to 'Transfer Pending' and queues the transfer for admin approval.
   */
  const requestTransfer = (complaintId, toDept) => {
    const complaint = officerComplaints.find(c => c.id === complaintId);
    if (!complaint) return;
    const transferId = `TR${Date.now()}`;
    setPendingTransfers(prev => [
      ...prev,
      {
        id: transferId,
        complaintId,
        fromDept: complaint.category,
        toDept,
        requestedAt: new Date().toISOString(),
        description: complaint.description,
        address: complaint.address,
        citizenName: complaint.citizenName,
      },
    ]);
    updateOfficerComplaint(complaintId, {
      status: 'Transfer Pending',
      pendingTransferId: transferId,
      pendingToDept: toDept,
    });
  };

  /**
   * Admin approves a transfer — moves complaint to target dept, status back to Pending.
   */
  const approveTransfer = (transferId) => {
    const transfer = pendingTransfers.find(t => t.id === transferId);
    if (!transfer) return;
    updateOfficerComplaint(transfer.complaintId, {
      category: transfer.toDept,
      status: 'Pending',
      pendingTransferId: null,
      pendingToDept: null,
    });
    setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
  };

  /**
   * Admin rejects a transfer — complaint reverts to 'In Progress'.
   */
  const rejectTransfer = (transferId) => {
    const transfer = pendingTransfers.find(t => t.id === transferId);
    if (!transfer) return;
    updateOfficerComplaint(transfer.complaintId, {
      status: 'In Progress',
      pendingTransferId: null,
      pendingToDept: null,
    });
    setPendingTransfers(prev => prev.filter(t => t.id !== transferId));
  };

  const loginDesktop = (credentials) => {
    // Mock login: officer / officer123, admin / admin123, citizen / citizen123
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const user = { name: 'Admin User', role: 'admin', dept: 'All Departments' };
      setIsAuthenticated(true);
      setAuthUser(user);
      setIsAdminLoggedIn(true);
      return { success: true, role: 'admin' };
    }
    if (credentials.username === 'officer' && credentials.password === 'officer123') {
      const user = { name: 'Suresh Kumar', role: 'officer', dept: 'Municipal / GHMC' };
      setIsAuthenticated(true);
      setAuthUser(user);
      setIsOfficerLoggedIn(true);
      return { success: true, role: 'officer' };
    }
    if (credentials.username === 'citizen' && credentials.password === 'citizen123') {
      const user = { name: 'Rahul Sharma', role: 'citizen', dept: 'Resident – Hyderabad' };
      setIsAuthenticated(true);
      setAuthUser(user);
      setIsCitizenLoggedIn(true);
      return { success: true, role: 'citizen' };
    }
    return { success: false };
  };

  const logoutDesktop = () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsOfficerLoggedIn(false);
    setIsAdminLoggedIn(false);
    setIsCitizenLoggedIn(false);
  };

  return (
    <AppContext.Provider value={{
      complaints, officerComplaints,
      capturedImage, setCapturedImage,
      addComplaint,
      updateOfficerComplaint,
      pendingTransfers,
      requestTransfer,
      approveTransfer,
      rejectTransfer,
      isAuthenticated, authUser, loginDesktop, logoutDesktop,
      isOfficerLoggedIn, setIsOfficerLoggedIn,
      isAdminLoggedIn, setIsAdminLoggedIn,
      isCitizenLoggedIn, setIsCitizenLoggedIn,
      sidebarOpen, setSidebarOpen,
      user,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
