import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsView.css';
import { logoutUser } from '../../services/authService';
import { fetchRoles, addRole, updateRole, deleteRole, fetchNotificationTemplates, updateNotificationTemplate, fetchSystemSettings, updateSystemSettings, copyApiKey, toggleLanguage, toggleTheme, searchSettings, fetchFareCosts, updateFareCosts, fetchPointsConfig, updatePointsConfig, fetchGovernmentImpositionAd, updateGovernmentImpositionAd } from '../../services/settingsService';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import notificationsIcon from '../../assets/icons/notifications.png';
import Toast from '../../components/common/Toast';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function SettingsView() {
  const navigate = useNavigate();
  const { theme, setThemeMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  // State management
  const [roles, setRoles] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    language: 'english',
    theme: 'light',
    apiKeys: {
      googleMaps: '',
      qpay: ''
    }
  });
  const [fareCosts, setFareCosts] = useState({
    costPerKilometer: 0,
    costPerMinute: 0,
    airportSurcharge: 0,
    surgeMultiplier: 1,
    nightSurcharge: 0,
    peakHourSurcharge: 0
  });
  const [rideTypeFares, setRideTypeFares] = useState({});
  const [rideTypeFarePlaceholders, setRideTypeFarePlaceholders] = useState({});
  const [rideTypeOptions, setRideTypeOptions] = useState([]);
  const [fareDescriptions, setFareDescriptions] = useState({});
  const [isSavingFareCosts, setIsSavingFareCosts] = useState(false);
  const [pointsConfig, setPointsConfig] = useState({
    pointsPerCompletedRide: 0,
    pointsForFreeRide: 0,
  });
  const [pointsDescriptions, setPointsDescriptions] = useState({});
  const [isSavingPointsConfig, setIsSavingPointsConfig] = useState(false);
  const [governmentImpositionApproved, setGovernmentImpositionApproved] = useState(false);
  const [isTogglingGovernmentImposition, setIsTogglingGovernmentImposition] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    permissions: ''
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, templatesResult, settingsResult, fareCostsResult, pointsConfigResult, governmentImpositionResult] = await Promise.all([
        fetchRoles(),
        fetchNotificationTemplates(),
        fetchSystemSettings(),
        fetchFareCosts(),
        fetchPointsConfig(),
        fetchGovernmentImpositionAd(),
      ]);

      if (rolesResult.success) {
        setRoles(rolesResult.data);
      }
      if (templatesResult.success) {
        setNotificationTemplates(templatesResult.data);
      }
      if (settingsResult.success) {
        // Mock "system settings" must not override real user prefs from localStorage
        const persistedTheme = localStorage.getItem('appTheme') || 'light';
        const persistedLanguage = localStorage.getItem('appLanguage') || 'english';
        setSystemSettings({
          ...settingsResult.data,
          theme: persistedTheme === 'dark' ? 'dark' : 'light',
          language: persistedLanguage === 'arabic' ? 'arabic' : 'english',
        });
      }
      if (fareCostsResult.success) {
        setFareCosts(fareCostsResult.data);
        setRideTypeFares(fareCostsResult.rideTypeFares || {});
        setRideTypeFarePlaceholders(fareCostsResult.rideTypeFarePlaceholders || {});
        setRideTypeOptions(fareCostsResult.rideTypeOptions || []);
        setFareDescriptions(fareCostsResult.descriptions || {});
      } else if (fareCostsResult.error) {
        showToastMessage(fareCostsResult.error, 'error');
      }
      if (pointsConfigResult.success) {
        setPointsConfig(pointsConfigResult.data);
        setPointsDescriptions(pointsConfigResult.descriptions || {});
      } else if (pointsConfigResult.error) {
        showToastMessage(pointsConfigResult.error, 'error');
      }
      if (governmentImpositionResult.success) {
        setGovernmentImpositionApproved(governmentImpositionResult.approved);
      } else if (governmentImpositionResult.error) {
        showToastMessage(governmentImpositionResult.error, 'error');
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
      showToastMessage(t('settings.failedToLoad'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const closeToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const handleLanguageToggle = async (lang) => {
    try {
      const result = await toggleLanguage(lang);
      if (result.success) {
        setLanguage(lang);
        setSystemSettings(prev => ({ ...prev, language: lang }));
        showToastMessage(t('settings.languageUpdated'), 'success');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      showToastMessage(t('settings.failedToUpdate'), 'error');
    }
  };

  const handleThemeToggle = async (newTheme) => {
    try {
      const result = await toggleTheme(newTheme);
      if (result.success) {
        setSystemSettings(prev => ({ ...prev, theme: newTheme }));
        // Update theme context
        setThemeMode(newTheme);
        showToastMessage(t('settings.themeUpdated'), 'success');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      showToastMessage(t('settings.failedToUpdate'), 'error');
    }
  };

  const handleCopyApiKey = async (keyType) => {
    try {
      const result = await copyApiKey(keyType);
      if (result.success) {
        showToastMessage(result.message, 'success');
      } else {
        showToastMessage(result.error, 'error');
      }
    } catch (error) {
      console.error('Error copying API key:', error);
      showToastMessage('Failed to copy API key', 'error');
    }
  };

  const handleAddRole = async () => {
    if (!newRoleData.name || !newRoleData.permissions) {
      showToastMessage(t('common.fillAllFields'), 'error');
      return;
    }

    try {
      const result = await addRole(newRoleData);
      if (result.success) {
        setRoles(prev => [...prev, result.data]);
        setShowAddRoleModal(false);
        setNewRoleData({ name: '', permissions: '' });
        showToastMessage(t('toast.roleAdded'), 'success');
      }
    } catch (error) {
      console.error('Error adding role:', error);
      showToastMessage(t('toast.failedToAdd'), 'error');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm(t('modals.confirmDelete'))) {
      try {
        const result = await deleteRole(roleId);
        if (result.success) {
          setRoles(prev => prev.filter(role => role.id !== roleId));
          showToastMessage(t('toast.roleDeleted'), 'success');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        showToastMessage(t('toast.failedToDelete'), 'error');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadSettingsData();
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchSettings(searchTerm);
      if (result.success) {
        setRoles(result.data.roles);
        setNotificationTemplates(result.data.templates);
      }
    } catch (error) {
      console.error('Error searching settings:', error);
      showToastMessage('Failed to search settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRideTypeFareChange = (rideType, field, value) => {
    const parsed = parseFloat(value);
    setRideTypeFares((prev) => ({
      ...prev,
      [rideType]: {
        baseFare: '',
        minimumFare: '',
        ...prev[rideType],
        [field]: value === '' ? '' : (Number.isFinite(parsed) ? parsed : ''),
      },
    }));
  };

  const handleFareCostChange = (field, value) => {
    const parsed = parseFloat(value);
    setFareCosts((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed)
        ? parsed
        : field === 'surgeMultiplier'
          ? prev.surgeMultiplier
          : 0,
    }));
  };

  const handlePointsConfigChange = (field, value) => {
    const parsed = parseInt(value, 10);
    setPointsConfig((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const handleSavePointsConfig = async () => {
    setIsSavingPointsConfig(true);
    try {
      const result = await updatePointsConfig(pointsConfig);
      if (result.success) {
        if (result.data) {
          setPointsConfig(result.data);
        }
        if (result.descriptions) {
          setPointsDescriptions(result.descriptions);
        }
        showToastMessage(
          result.error
            ? `${result.message || t('settings.pointsConfigUpdated')} — ${result.error}`
            : result.message || t('settings.pointsConfigUpdated'),
          result.error ? 'info' : 'success'
        );
      } else {
        showToastMessage(result.error || t('settings.failedToUpdate'), 'error');
      }
    } catch (error) {
      console.error('Error updating points config:', error);
      showToastMessage(t('settings.failedToUpdate'), 'error');
    } finally {
      setIsSavingPointsConfig(false);
    }
  };

  const handleGovernmentImpositionToggle = async (approved) => {
    if (approved === governmentImpositionApproved || isTogglingGovernmentImposition) {
      return;
    }

    setIsTogglingGovernmentImposition(true);
    try {
      const result = await updateGovernmentImpositionAd(approved);
      if (result.success) {
        setGovernmentImpositionApproved(result.approved);
        showToastMessage(result.message || t('settings.governmentImpositionUpdated'), 'success');
      } else {
        showToastMessage(result.error || t('settings.failedToUpdate'), 'error');
      }
    } catch (error) {
      console.error('Error updating government imposition setting:', error);
      showToastMessage(t('settings.failedToUpdate'), 'error');
    } finally {
      setIsTogglingGovernmentImposition(false);
    }
  };

  const handleSaveFareCosts = async () => {
    setIsSavingFareCosts(true);
    try {
      const result = await updateFareCosts(fareCosts, rideTypeFares);
      if (result.success) {
        if (result.data) {
          setFareCosts(result.data);
        }
        if (result.rideTypeFares) {
          setRideTypeFares(result.rideTypeFares);
        }
        if (result.rideTypeFarePlaceholders) {
          setRideTypeFarePlaceholders(result.rideTypeFarePlaceholders);
        }
        if (result.rideTypeOptions) {
          setRideTypeOptions(result.rideTypeOptions);
        }
        if (result.descriptions) {
          setFareDescriptions(result.descriptions);
        }
        showToastMessage(
          result.error
            ? `${result.message || t('settings.fareCostsUpdated')} — ${result.error}`
            : result.message || t('settings.fareCostsUpdated'),
          result.error ? 'info' : 'success'
        );
      } else {
        showToastMessage(result.error || t('settings.failedToUpdate'), 'error');
      }
    } catch (error) {
      console.error('Error updating fare costs:', error);
      showToastMessage(t('settings.failedToUpdate'), 'error');
    } finally {
      setIsSavingFareCosts(false);
    }
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
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'marketers') {
      navigate('/marketers');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'financial') {
      navigate('/dashboard?section=financial');
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'notifications') {
      navigate('/notifications');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
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

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  return (
    <div className="settings-view grid-root">
      <aside className="side">
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
          <NavItem icon="notifications" label="Notifications" onClick={() => handleNavClick('notifications')} />
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

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>{t('settings.adminSettings')}</h1>
            <p className="sub">{t('settings.manageConfiguration')}</p>
          </div>
          <div className="acts">
            <div className="search-container">
              <input
                type="text"
                placeholder={t('settings.searchSettings')}
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
            <ThemeToggle />
            <button className="notifications-btn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <span className="notification-dot"></span>
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label="logout" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* System Settings Section */}
              <div className="settings-card system-settings-card">
                <div className="card-header">
                  <h2>{t('settings.systemSettings')}</h2>
                </div>
                <div className="card-content">
                  <div className="settings-grid">
                    <div className="settings-section">
                      <h3>{t('settings.displayLanguage')}</h3>
                      <div className="setting-group">
                        <label>{t('settings.language')}</label>
                        <div className="toggle-group">
                          <button
                            className={`toggle-btn ${language === 'english' ? 'active' : ''}`}
                            onClick={() => handleLanguageToggle('english')}
                          >
                            English
                          </button>
                          <button
                            className={`toggle-btn ${language === 'arabic' ? 'active' : ''}`}
                            onClick={() => handleLanguageToggle('arabic')}
                          >
                            العربية
                          </button>
                        </div>
                      </div>
                      <div className="setting-group">
                        <label>{t('settings.theme')}</label>
                        <div className="toggle-group">
                          <button
                            className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeToggle('light')}
                          >
                            <span className="material-symbols-outlined">light_mode</span>
                            {t('settings.light')}
                          </button>
                          <button
                            className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeToggle('dark')}
                          >
                            <span className="material-symbols-outlined">dark_mode</span>
                            {t('settings.dark')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h3>{t('settings.apiKeys')}</h3>
                      <div className="setting-group">
                        <label>{t('settings.googleMapsApiKey')}</label>
                        <div className="api-key-input">
                          <input
                            type="text"
                            value={maskApiKey(systemSettings.apiKeys.googleMaps)}
                            readOnly
                            className="api-key-field"
                          />
                          <button
                            className="copy-btn"
                            onClick={() => handleCopyApiKey('googleMaps')}
                            title={t('settings.copyApiKey')}
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                          </button>
                        </div>
                      </div>
                      <div className="setting-group">
                        <label>{t('settings.qpayApiKey')}</label>
                        <div className="api-key-input">
                          <input
                            type="text"
                            value={maskApiKey(systemSettings.apiKeys.qpay)}
                            readOnly
                            className="api-key-field"
                          />
                          <button
                            className="copy-btn"
                            onClick={() => handleCopyApiKey('qpay')}
                            title={t('settings.copyApiKey')}
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Cost Management Section */}
              <div className="settings-card fare-cost-card">
                <div className="card-header">
                  <h2>{t('settings.fareCostManagement')}</h2>
                  <button 
                    className="save-fare-costs-btn" 
                    onClick={handleSaveFareCosts}
                    disabled={isSavingFareCosts}
                  >
                    <span className="material-symbols-outlined">
                      {isSavingFareCosts ? 'hourglass_empty' : 'save'}
                    </span>
                    {isSavingFareCosts ? t('settings.saving') : t('settings.saveChanges')}
                  </button>
                </div>
                <div className="card-content">
                  <div className="fare-costs-grid">
                    <div className="fare-cost-section fare-cost-section-full">
                      <h3>{t('settings.rideTypePricing')}</h3>
                      <div className="ride-type-fares-grid">
                        {rideTypeOptions.length === 0 ? (
                          <p className="fare-description">{t('settings.noRideTypeFares')}</p>
                        ) : (
                          rideTypeOptions.map(({ id, label }) => (
                          <div key={id} className="ride-type-fare-card">
                            <h4>{label}</h4>
                            <div className="fare-cost-group">
                              <label htmlFor={`${id}-baseFare`}>{t('settings.baseFare')}</label>
                              <div className="fare-input-wrapper">
                                <span className="currency-symbol">QAR</span>
                                <input
                                  id={`${id}-baseFare`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={rideTypeFares[id]?.baseFare ?? ''}
                                  onChange={(e) => handleRideTypeFareChange(id, 'baseFare', e.target.value)}
                                  className="fare-input"
                                  placeholder={rideTypeFarePlaceholders[id]?.baseFare || undefined}
                                />
                              </div>
                            </div>
                            <div className="fare-cost-group">
                              <label htmlFor={`${id}-minimumFare`}>{t('settings.minimumFare')}</label>
                              <div className="fare-input-wrapper">
                                <span className="currency-symbol">QAR</span>
                                <input
                                  id={`${id}-minimumFare`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={rideTypeFares[id]?.minimumFare ?? ''}
                                  onChange={(e) => handleRideTypeFareChange(id, 'minimumFare', e.target.value)}
                                  className="fare-input"
                                  placeholder={rideTypeFarePlaceholders[id]?.minimumFare || undefined}
                                />
                              </div>
                            </div>
                          </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="fare-cost-section">
                      <h3>{t('settings.distanceTime')}</h3>
                      <div className="fare-cost-group">
                        <label htmlFor="costPerKilometer">{t('settings.costPerKilometer')}</label>
                        <div className="fare-input-wrapper">
                          <span className="currency-symbol">QAR</span>
                          <input
                            id="costPerKilometer"
                            type="number"
                            step="0.01"
                            min="0"
                            value={fareCosts.costPerKilometer}
                            onChange={(e) => handleFareCostChange('costPerKilometer', e.target.value)}
                            className="fare-input"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="fare-description">{fareDescriptions.costPerKilometer || t('settings.chargedPerKm')}</p>
                      </div>
                      <div className="fare-cost-group">
                        <label htmlFor="costPerMinute">{t('settings.costPerMinute')}</label>
                        <div className="fare-input-wrapper">
                          <span className="currency-symbol">QAR</span>
                          <input
                            id="costPerMinute"
                            type="number"
                            step="0.01"
                            min="0"
                            value={fareCosts.costPerMinute}
                            onChange={(e) => handleFareCostChange('costPerMinute', e.target.value)}
                            className="fare-input"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="fare-description">{fareDescriptions.costPerMinute || t('settings.chargedPerMinute')}</p>
                      </div>
                    </div>

                    <div className="fare-cost-section">
                      <h3>{t('settings.surcharges')}</h3>
                      <div className="fare-cost-group">
                        <label htmlFor="airportSurcharge">{t('settings.airportSurcharge')}</label>
                        <div className="fare-input-wrapper">
                          <span className="currency-symbol">QAR</span>
                          <input
                            id="airportSurcharge"
                            type="number"
                            step="0.01"
                            min="0"
                            value={fareCosts.airportSurcharge}
                            onChange={(e) => handleFareCostChange('airportSurcharge', e.target.value)}
                            className="fare-input"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="fare-description">{fareDescriptions.airportSurcharge || t('settings.airportFee')}</p>
                      </div>
                      <div className="fare-cost-group">
                        <label htmlFor="nightSurcharge">{t('settings.nightSurcharge')}</label>
                        <div className="fare-input-wrapper">
                          <span className="currency-symbol">QAR</span>
                          <input
                            id="nightSurcharge"
                            type="number"
                            step="0.01"
                            min="0"
                            value={fareCosts.nightSurcharge}
                            onChange={(e) => handleFareCostChange('nightSurcharge', e.target.value)}
                            className="fare-input"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="fare-description">{fareDescriptions.nightSurcharge || t('settings.nightFee')}</p>
                      </div>
                      <div className="fare-cost-group">
                        <label htmlFor="peakHourSurcharge">{t('settings.peakHourSurcharge')}</label>
                        <div className="fare-input-wrapper">
                          <span className="currency-symbol">QAR</span>
                          <input
                            id="peakHourSurcharge"
                            type="number"
                            step="0.01"
                            min="0"
                            value={fareCosts.peakHourSurcharge}
                            onChange={(e) => handleFareCostChange('peakHourSurcharge', e.target.value)}
                            className="fare-input"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="fare-description">{fareDescriptions.peakHourSurcharge || t('settings.peakHourFee')}</p>
                      </div>
                    </div>

                    <div className="fare-cost-section">
                      <h3>{t('settings.dynamicPricing')}</h3>
                      <div className="fare-cost-group">
                        <label htmlFor="surgeMultiplier">{t('settings.surgeMultiplier')}</label>
                        <div className="fare-input-wrapper">
                          <input
                            id="surgeMultiplier"
                            type="number"
                            step="0.1"
                            min="1.0"
                            value={fareCosts.surgeMultiplier}
                            onChange={(e) => handleFareCostChange('surgeMultiplier', e.target.value)}
                            className="fare-input"
                            placeholder="1.0"
                          />
                          <span className="multiplier-symbol">x</span>
                        </div>
                        <p className="fare-description">{fareDescriptions.surgeMultiplier || t('settings.multiplierDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Government Imposition Section */}
              <div className="settings-card government-imposition-card">
                <div className="card-header">
                  <h2>{t('settings.governmentImposition')}</h2>
                </div>
                <div className="card-content">
                  <p className="points-program-intro">{t('settings.governmentImpositionIntro')}</p>
                  <div className="setting-group government-imposition-toggle">
                    <label>{t('settings.governmentImpositionToggle')}</label>
                    <div className="toggle-group">
                      <button
                        type="button"
                        className={`toggle-btn ${governmentImpositionApproved ? 'active' : ''}`}
                        onClick={() => handleGovernmentImpositionToggle(true)}
                        disabled={isTogglingGovernmentImposition}
                      >
                        {t('settings.enabled')}
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${!governmentImpositionApproved ? 'active' : ''}`}
                        onClick={() => handleGovernmentImpositionToggle(false)}
                        disabled={isTogglingGovernmentImposition}
                      >
                        {t('settings.disabled')}
                      </button>
                    </div>
                    <p className="fare-description">{t('settings.governmentImpositionDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Rider Points Program Section */}
              <div className="settings-card points-config-card">
                <div className="card-header">
                  <h2>{t('settings.pointsProgram')}</h2>
                  <button
                    className="save-points-config-btn"
                    onClick={handleSavePointsConfig}
                    disabled={isSavingPointsConfig}
                  >
                    <span className="material-symbols-outlined">
                      {isSavingPointsConfig ? 'hourglass_empty' : 'save'}
                    </span>
                    {isSavingPointsConfig ? t('settings.saving') : t('settings.saveChanges')}
                  </button>
                </div>
                <div className="card-content">
                  <p className="points-program-intro">{t('settings.pointsProgramIntro')}</p>
                  <div className="points-config-grid">
                    <div className="fare-cost-group">
                      <label htmlFor="pointsPerCompletedRide">{t('settings.pointsPerCompletedRide')}</label>
                      <div className="fare-input-wrapper">
                        <span className="points-symbol material-symbols-outlined">loyalty</span>
                        <input
                          id="pointsPerCompletedRide"
                          type="number"
                          step="1"
                          min="0"
                          value={pointsConfig.pointsPerCompletedRide}
                          onChange={(e) => handlePointsConfigChange('pointsPerCompletedRide', e.target.value)}
                          className="fare-input"
                          placeholder="0"
                        />
                      </div>
                      <p className="fare-description">
                        {pointsDescriptions.pointsPerCompletedRide || t('settings.pointsPerCompletedRideDesc')}
                      </p>
                    </div>
                    <div className="fare-cost-group">
                      <label htmlFor="pointsForFreeRide">{t('settings.pointsForFreeRide')}</label>
                      <div className="fare-input-wrapper">
                        <span className="points-symbol material-symbols-outlined">redeem</span>
                        <input
                          id="pointsForFreeRide"
                          type="number"
                          step="1"
                          min="0"
                          value={pointsConfig.pointsForFreeRide}
                          onChange={(e) => handlePointsConfigChange('pointsForFreeRide', e.target.value)}
                          className="fare-input"
                          placeholder="0"
                        />
                      </div>
                      <p className="fare-description">
                        {pointsDescriptions.pointsForFreeRide || t('settings.pointsForFreeRideDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Role Management Section */}
              <div className="settings-card role-management-card">
                <div className="card-header">
                  <h2>{t('settings.adminRoleManagement')}</h2>
                  <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
                    <span className="material-symbols-outlined">add</span>
                    {t('settings.addNewRole')}
                  </button>
                </div>
                <div className="card-content">
                  <div className="roles-table-container">
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>{t('settings.roleName')}</th>
                          <th>{t('settings.permissions')}</th>
                          <th>{t('settings.users')}</th>
                          <th>{t('settings.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td className="role-name">{role.name}</td>
                            <td className="permissions">{role.permissions}</td>
                            <td className="user-count">{role.users}</td>
                            <td className="actions-cell">
                              <div className="action-links">
                                <button className="edit-link">{t('settings.edit')}</button>
                                {role.canDelete && (
                                  <button 
                                    className="delete-link"
                                    onClick={() => handleDeleteRole(role.id)}
                                  >
                                    {t('settings.delete')}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notification Templates Section */}
              <div className="settings-card notification-templates-card">
                <div className="card-header">
                  <h2>{t('settings.notificationTemplates')}</h2>
                </div>
                <div className="card-content">
                  <div className="templates-grid">
                    {notificationTemplates.map((template) => (
                      <div key={template.id} className="template-card">
                        <div className="template-content">
                          <h3>{template.title}</h3>
                          <p>{template.description}</p>
                        </div>
                        <button className="template-arrow">
                          <span className="material-symbols-outlined">arrow_forward_ios</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t('settings.addNewRole')}</h3>
            <div className="form-group">
              <label>{t('settings.roleName')}</label>
              <input
                type="text"
                value={newRoleData.name}
                onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('settings.roleName')}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t('settings.permissions')}</label>
              <textarea
                value={newRoleData.permissions}
                onChange={(e) => setNewRoleData(prev => ({ ...prev, permissions: e.target.value }))}
                placeholder={t('settings.permissions')}
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddRoleModal(false)}>
                {t('common.cancel')}
              </button>
              <button className="add-btn" onClick={handleAddRole}>
                {t('settings.addNewRole')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={closeToast}
        />
      )}
    </div>
  );
}
