import React from 'react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './views/auth/LoginView.jsx';
import DashboardView from './views/dashboard/DashboardView.jsx';
import RideManagementView from './views/rides/RideManagementView.jsx';
import RideDetailsView from './views/rides/RideDetailsView.jsx';
import UserManagementView from './views/users/UserManagementView.jsx';
import DriverManagementView from './views/drivers/DriverManagementView.jsx';
import DriverProfileView from './views/drivers/DriverProfileView.jsx';
import UserProfileView from './views/users/UserProfileView.jsx';
import ReportsGeneratorView from './views/reports/ReportsGeneratorView.jsx';
import SettingsView from './views/settings/SettingsView.jsx';
import AuthGuard from './components/AuthGuard.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/dashboard" element={
          <AuthGuard>
            <DashboardView />
          </AuthGuard>
        } />
        <Route path="/ride-management" element={
          <AuthGuard>
            <RideManagementView />
          </AuthGuard>
        } />
        <Route path="/ride-details/:rideId" element={
          <AuthGuard>
            <RideDetailsView />
          </AuthGuard>
        } />
        <Route path="/user-management" element={
          <AuthGuard>
            <UserManagementView />
          </AuthGuard>
        } />
        <Route path="/driver-management" element={
          <AuthGuard>
            <DriverManagementView />
          </AuthGuard>
        } />
        <Route path="/driver-profile/:driverId" element={
          <AuthGuard>
            <DriverProfileView />
          </AuthGuard>
        } />
        <Route path="/user-profile/:userId" element={
          <AuthGuard>
            <UserProfileView />
          </AuthGuard>
        } />
        <Route path="/reports" element={
          <AuthGuard>
            <ReportsGeneratorView />
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard>
            <SettingsView />
          </AuthGuard>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
