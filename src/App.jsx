import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, isMobileDevice, useApp } from './context/AppContext.jsx';

// Mobile pages
import Sidebar from './components/Sidebar.jsx';
import CameraScreen from './pages/CameraScreen.jsx';
import ComplaintForm from './pages/ComplaintForm.jsx';
import ComplaintStatus from './pages/ComplaintStatus.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import ReviewScreen from './pages/ReviewScreen.jsx';
import ProfileScreen from './pages/ProfileScreen.jsx';
import OfficerLogin from './pages/OfficerLogin.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import HeatmapScreen from './pages/HeatmapScreen.jsx';

// Desktop pages
import DesktopLogin from './pages/DesktopLogin.jsx';
import DesktopLayout from './pages/DesktopLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

/** Watches window width and returns isMobile boolean */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => isMobileDevice());
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

function RootRedirect() {
  const { isAuthenticated, authUser } = useApp();
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile always goes to camera
    return <Navigate to="/camera" replace />;
  }

  if (!isAuthenticated) {
    // Desktop, not logged in → login page
    return <Navigate to="/login" replace />;
  }

  // Desktop, logged in → dashboard
  return <Navigate to="/dashboard" replace />;
}

function MobileRoutes() {
  return (
    <>
      <Sidebar />
      <Routes>
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/submit" element={<ComplaintForm />} />
        <Route path="/status" element={<ComplaintStatus />} />
        <Route path="/complaint/:id" element={<ComplaintDetails />} />
        <Route path="/review/:id" element={<ReviewScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/heatmap" element={<HeatmapScreen />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
}

function DesktopRoutes() {
  const { isAuthenticated } = useApp();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <DesktopLogin />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DesktopLayout /> : <Navigate to="/login" replace />}
      />
      {/* Sub-routes rendered inside DesktopLayout via Outlet */}
      <Route
        path="/admin"
        element={isAuthenticated ? <DesktopLayout page="admin" /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/officer/dashboard"
        element={isAuthenticated ? <DesktopLayout page="officer" /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/heatmap"
        element={isAuthenticated ? <DesktopLayout page="heatmap" /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/status"
        element={isAuthenticated ? <DesktopLayout page="status" /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function AppRouter() {
  const isMobile = useIsMobile();

  return (
    <div className={`relative h-full flex flex-col ${isMobile ? 'max-w-md mx-auto' : ''}`}>
      {isMobile ? <MobileRoutes /> : <DesktopRoutes />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProvider>
  );
}
