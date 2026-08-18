import React, { lazy } from 'react';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './styles/theme.css';
import './components/layout/AdminShell.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import LoginView from './views/auth/LoginView.jsx';
import AuthGuard from './components/layout/AuthGuard.jsx';
import LazyRoute from './components/layout/LazyRoute.jsx';

const DashboardView = lazy(() => import('./views/dashboard/DashboardView.jsx'));
const RideManagementView = lazy(() => import('./views/rides/RideManagementView.jsx'));
const RideDetailsView = lazy(() => import('./views/rides/RideDetailsView.jsx'));
const DriverManagementView = lazy(() => import('./views/drivers/DriverManagementView.jsx'));
const DriverProfileView = lazy(() => import('./views/drivers/DriverProfileView.jsx'));
const ReportsGeneratorView = lazy(() => import('./views/reports/ReportsGeneratorView.jsx'));
const SettingsView = lazy(() => import('./views/settings/SettingsView.jsx'));
const CourierManagementView = lazy(() => import('./views/courier/CourierManagementView.jsx'));
const RentalManagementView = lazy(() => import('./views/rentals/RentalManagementView.jsx'));
const WithdrawalManagementView = lazy(() => import('./views/withdrawals/WithdrawalManagementView.jsx'));
const NotificationManagementView = lazy(() => import('./views/notifications/NotificationManagementView.jsx'));
const MarketersManagementView = lazy(() => import('./views/marketers/MarketersManagementView.jsx'));
const PartnersManagementView = lazy(() => import('./views/partners/PartnersManagementView.jsx'));
const PartnerDetailView = lazy(() => import('./views/partners/PartnerDetailView.jsx'));
const InfluencersManagementView = lazy(() => import('./views/influencers/InfluencersManagementView.jsx'));
const InfluencerDetailView = lazy(() => import('./views/influencers/InfluencerDetailView.jsx'));
const AppUpdateView = lazy(() => import('./views/app-update/AppUpdateView.jsx'));

const withAuth = (element) => (
  <AuthGuard>
    <LazyRoute>{element}</LazyRoute>
  </AuthGuard>
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/dashboard" element={withAuth(<DashboardView />)} />
        <Route path="/ride-management" element={withAuth(<RideManagementView />)} />
        <Route path="/ride-details/:rideId" element={withAuth(<RideDetailsView />)} />
        <Route path="/driver-management" element={withAuth(<DriverManagementView />)} />
        <Route path="/driver-profile/:driverId" element={withAuth(<DriverProfileView />)} />
        <Route path="/reports" element={withAuth(<ReportsGeneratorView />)} />
        <Route path="/settings" element={withAuth(<SettingsView />)} />
        <Route path="/courier-management" element={withAuth(<CourierManagementView />)} />
        <Route path="/rental-management" element={withAuth(<RentalManagementView />)} />
        <Route path="/withdrawals" element={withAuth(<WithdrawalManagementView />)} />
        <Route path="/notifications" element={withAuth(<NotificationManagementView />)} />
        <Route path="/marketers" element={withAuth(<MarketersManagementView />)} />
        <Route path="/partners" element={withAuth(<PartnersManagementView />)} />
        <Route path="/partners/:partnerId/activity" element={withAuth(<PartnerDetailView />)} />
        <Route path="/influencers" element={withAuth(<InfluencersManagementView />)} />
        <Route path="/influencers/:influencerId/activity" element={withAuth(<InfluencerDetailView />)} />
        <Route path="/app-update" element={withAuth(<AppUpdateView />)} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
