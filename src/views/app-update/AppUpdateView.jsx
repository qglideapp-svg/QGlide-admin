import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AppUpdateView.css';
import { logoutUser } from '../../services/authService';
import {
  DEFAULT_APP_VERSION_CONFIG,
  fetchAppVersionConfig,
  updateAppVersionConfig,
} from '../../services/appUpdateService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import notificationsIcon from '../../assets/icons/notifications.png';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function AppUpdateView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingForceUpdate, setIsTogglingForceUpdate] = useState(false);
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({ ...DEFAULT_APP_VERSION_CONFIG });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAppVersionConfig();
      if (result.success) {
        setConfig(result.data);
      } else {
        setToast({ type: 'error', message: result.error || t('appUpdate.loadError') });
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message || t('appUpdate.loadError') });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'courier-management') {
      navigate('/courier-management');
    } else if (navItem === 'rental-management') {
      navigate('/rental-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'marketers') {
      navigate('/marketers');
    } else if (navItem === 'financial') {
      navigate('/dashboard?section=financial');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'notifications') {
      navigate('/notifications');
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('common.confirmLogout'))) {
      try {
        await logoutUser();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const persistConfig = async (nextConfig, { toggling = false } = {}) => {
    if (toggling) {
      setIsTogglingForceUpdate(true);
    } else {
      setIsSaving(true);
    }

    try {
      const result = await updateAppVersionConfig(nextConfig);
      if (result.success) {
        setConfig(result.data);
        setToast({
          type: 'success',
          message: result.message || t('appUpdate.saveSuccess'),
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || t('appUpdate.saveError'),
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || t('appUpdate.saveError'),
      });
    } finally {
      if (toggling) {
        setIsTogglingForceUpdate(false);
      } else {
        setIsSaving(false);
      }
    }
  };

  const handleForceUpdateToggle = async (forceUpdate) => {
    if (forceUpdate === config.forceUpdate || isTogglingForceUpdate) {
      return;
    }
    await persistConfig({ ...config, forceUpdate }, { toggling: true });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await persistConfig(config);
  };

  return (
    <div className={`app-update grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label={t('navigation.userManagement')} onClick={() => handleNavClick('user-management')} />
          <NavItem icon="manage_accounts" label={t('navigation.marketers')} onClick={() => handleNavClick('marketers')} />
          <NavItem icon="account_balance_wallet" label={t('navigation.financial')} onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label={t('navigation.withdrawals')} onClick={() => handleNavClick('withdrawals')} />
          <NavItem icon="notifications" label={t('navigation.notifications')} onClick={() => handleNavClick('notifications')} />
          <NavItem icon="system_update" label={t('navigation.appUpdate')} active={true} />
          <NavItem icon="support_agent" label={t('navigation.support')} onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label={t('navigation.analytics')} onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label={t('navigation.reports')} onClick={() => handleNavClick('reports')} />
        </nav>

        <div className="sfoot">
          <button className="settings" type="button" onClick={() => navigate('/settings')}>
            <img src={settingsIcon} alt="settings" className="kimg" />
            <span>{t('common.settings')}</span>
          </button>
          <div className="urow">
            <img src="https://i.pravatar.cc/80?img=5" alt="Amina" className="avatar" />
            <div className="meta">
              <div className="name">QGlide Admin</div>
              <div className="role">Super Admin</div>
            </div>
            <button className="logout-btn-sidebar" aria-label={t('common.logout')} onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top">
          <div className="titles">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1>{t('appUpdate.title')}</h1>
              <p className="sub">{t('appUpdate.subtitle')}</p>
            </div>
          </div>
          <div className="acts">
            <ThemeToggle />
            <button className="ibtn" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <button className="ibtn" aria-label={t('common.notifications')}>
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          {isLoading ? (
            <div className="app-update-card loading-card">
              <span className="material-symbols-outlined spin">hourglass_empty</span>
              <p>{t('appUpdate.loading')}</p>
            </div>
          ) : (
            <>
              <div className="app-update-card force-update-card">
                <div className="card-header">
                  <div className="header-left">
                    <h2>{t('appUpdate.forceUpdateTitle')}</h2>
                    <p className="subtitle">{t('appUpdate.forceUpdateIntro')}</p>
                  </div>
                  <div className={`status-badge ${config.forceUpdate ? 'on' : 'off'}`}>
                    {config.forceUpdate ? t('appUpdate.forceUpdateOn') : t('appUpdate.forceUpdateOff')}
                  </div>
                </div>
                <div className="card-content">
                  <div className="setting-group force-update-toggle">
                    <label>{t('appUpdate.forceUpdateToggle')}</label>
                    <div className="toggle-group">
                      <button
                        type="button"
                        className={`toggle-btn ${config.forceUpdate ? 'active' : ''}`}
                        onClick={() => handleForceUpdateToggle(true)}
                        disabled={isTogglingForceUpdate}
                      >
                        {t('settings.enabled')}
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${!config.forceUpdate ? 'active' : ''}`}
                        onClick={() => handleForceUpdateToggle(false)}
                        disabled={isTogglingForceUpdate}
                      >
                        {t('settings.disabled')}
                      </button>
                    </div>
                    <p className="field-hint">{t('appUpdate.forceUpdateDesc')}</p>
                  </div>
                </div>
              </div>

              <form className="app-update-card config-card" onSubmit={handleSave}>
                <div className="card-header">
                  <div className="header-left">
                    <h2>{t('appUpdate.configTitle')}</h2>
                    <p className="subtitle">{t('appUpdate.configIntro')}</p>
                  </div>
                  <button type="submit" className="btn-save" disabled={isSaving}>
                    <span className="material-symbols-outlined">
                      {isSaving ? 'hourglass_empty' : 'save'}
                    </span>
                    {isSaving ? t('appUpdate.saving') : t('appUpdate.save')}
                  </button>
                </div>

                <div className="card-content form-grid">
                  <div className="form-group">
                    <label htmlFor="minAndroidVersion">{t('appUpdate.minAndroidVersion')}</label>
                    <input
                      id="minAndroidVersion"
                      type="text"
                      value={config.minAndroidVersion}
                      onChange={(e) => handleInputChange('minAndroidVersion', e.target.value)}
                      placeholder="3.7.0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="minIosVersion">{t('appUpdate.minIosVersion')}</label>
                    <input
                      id="minIosVersion"
                      type="text"
                      value={config.minIosVersion}
                      onChange={(e) => handleInputChange('minIosVersion', e.target.value)}
                      placeholder="3.7.0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="latestAndroidVersion">{t('appUpdate.latestAndroidVersion')}</label>
                    <input
                      id="latestAndroidVersion"
                      type="text"
                      value={config.latestAndroidVersion}
                      onChange={(e) => handleInputChange('latestAndroidVersion', e.target.value)}
                      placeholder="3.7.0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="latestIosVersion">{t('appUpdate.latestIosVersion')}</label>
                    <input
                      id="latestIosVersion"
                      type="text"
                      value={config.latestIosVersion}
                      onChange={(e) => handleInputChange('latestIosVersion', e.target.value)}
                      placeholder="3.7.0"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="updateTitle">{t('appUpdate.updateTitle')}</label>
                    <input
                      id="updateTitle"
                      type="text"
                      value={config.updateTitle}
                      onChange={(e) => handleInputChange('updateTitle', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="updateMessage">{t('appUpdate.updateMessage')}</label>
                    <textarea
                      id="updateMessage"
                      value={config.updateMessage}
                      onChange={(e) => handleInputChange('updateMessage', e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="androidStoreUrl">{t('appUpdate.androidStoreUrl')}</label>
                    <input
                      id="androidStoreUrl"
                      type="url"
                      value={config.androidStoreUrl}
                      onChange={(e) => handleInputChange('androidStoreUrl', e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="iosStoreUrl">{t('appUpdate.iosStoreUrl')}</label>
                    <input
                      id="iosStoreUrl"
                      type="url"
                      value={config.iosStoreUrl}
                      onChange={(e) => handleInputChange('iosStoreUrl', e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </div>
  );
}
