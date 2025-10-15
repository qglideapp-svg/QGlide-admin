import React from 'react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './views/LoginView.jsx';
import DashboardView from './views/DashboardView.jsx';
import RideManagementView from './views/RideManagementView.jsx';
import RideDetailsView from './views/RideDetailsView.jsx';
import UserManagementView from './views/UserManagementView.jsx';
import DriverManagementView from './views/DriverManagementView.jsx';
import DriverProfileView from './views/DriverProfileView.jsx';
import UserProfileView from './views/UserProfileView.jsx';
import ReportsGeneratorView from './views/ReportsGeneratorView.jsx';
import SettingsView from './views/SettingsView.jsx';
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
