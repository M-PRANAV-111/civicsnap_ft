import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, isMobileDevice, useApp } from './context/AppContext.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';

// Mobile pages
import Sidebar from './components/Sidebar.jsx';
import InstallBanner from './components/InstallBanner.jsx';
import CameraScreen from './pages/CameraScreen.jsx';
import ComplaintForm from './pages/ComplaintForm.jsx';
import ComplaintStatus from './pages/ComplaintStatus.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import ReviewScreen from './pages/ReviewScreen.jsx';
import ProfileScreen from './pages/ProfileScreen.jsx';
import OfficerLogin from './pages/OfficerLogin.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import HeatmapScreen from './pages/HeatmapScreen.jsx';
import MobileLogin from './pages/MobileLogin.jsx';

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
  const { isAuthenticated } = useApp();
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

function RequireAuth({ children, roles, redirectTo = '/login' }) {
  const { authUser, isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles?.length && !roles.includes(authUser?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function MobileRoutes() {
  return (
    <>
      <Sidebar />
      <InstallBanner />
      <Routes>
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/submit" element={<ComplaintForm />} />
        <Route path="/status" element={<ComplaintStatus />} />
        <Route path="/complaint/:id" element={<ComplaintDetails />} />
        <Route path="/review/:id" element={<ReviewScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/mobile-login" element={<MobileLogin />} />
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route
          path="/officer/dashboard"
          element={
            <RequireAuth roles={['officer']} redirectTo="/officer/login">
              <OfficerDashboard />
            </RequireAuth>
          }
        />
        <Route path="/heatmap" element={<HeatmapScreen />} />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={['admin']}>
              <AdminDashboard />
            </RequireAuth>
          }
        />
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
        element={
          <RequireAuth>
            <DesktopLayout />
          </RequireAuth>
        }
      />
      {/* Sub-routes rendered inside DesktopLayout via Outlet */}
      <Route
        path="/admin"
        element={
          <RequireAuth roles={['admin']}>
            <DesktopLayout page="admin" />
          </RequireAuth>
        }
      />
      <Route
        path="/officer/dashboard"
        element={
          <RequireAuth roles={['officer', 'admin']}>
            <DesktopLayout page="officer" />
          </RequireAuth>
        }
      />
      <Route
        path="/heatmap"
        element={
          <RequireAuth>
            <DesktopLayout page="heatmap" />
          </RequireAuth>
        }
      />
      <Route
        path="/status"
        element={
          <RequireAuth>
            <DesktopLayout page="status" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function AppRouter() {
  const isMobile = useIsMobile();

  return (
    <div
      className={`relative w-full h-full flex flex-col ${isMobile ? 'max-w-md mx-auto' : ''}`}
      style={{ minHeight: '100dvh' }}
    >
      {isMobile && (
        <div
          className="fixed z-30"
          style={{
            top: 'calc(0.75rem + env(safe-area-inset-top))',
            right: '1rem',
          }}
        >
          <LanguageSwitcher compact />
        </div>
      )}
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
