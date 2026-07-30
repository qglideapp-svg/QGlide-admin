import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './InfluencersManagementView.css';
import '../../components/influencers/InfluencerAnalytics.css';
import { logoutUser } from '../../services/authService';
import { createInfluencer, fetchInfluencersList } from '../../services/influencerService';
import { fetchInfluencerAnalyticsOverview } from '../../services/influencerAnalytics';
import InfluencerAnalyticsDashboard from '../../components/influencers/InfluencerAnalyticsDashboard';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import AddInfluencerModal from '../../components/modals/AddInfluencerModal';
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

export default function InfluencersManagementView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [influencers, setInfluencers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const loadInfluencers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await fetchInfluencersList({ page: 1, limit: 50 });
    if (result.success && result.data?.influencers) {
      setInfluencers(result.data.influencers);
    } else {
      setLoadError(result.error || t('influencers.errorLoad'));
      setInfluencers([]);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    loadInfluencers();
  }, [loadInfluencers]);

  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    const result = await fetchInfluencerAnalyticsOverview({
      period: analyticsPeriod,
    });
    if (result.success && result.data) {
      setAnalyticsData(result.data);
    } else {
      setAnalyticsData(null);
      setAnalyticsError(result.error || t('influencers.analyticsNoData'));
    }
    setIsAnalyticsLoading(false);
  }, [analyticsPeriod, t]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, analyticsPeriod, loadAnalytics]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return influencers;
    return influencers.filter(
      (inf) =>
        inf.email.toLowerCase().includes(q) ||
        (inf.displayName && inf.displayName.toLowerCase().includes(q)) ||
        (inf.phone && inf.phone.toLowerCase().includes(q))
    );
  }, [influencers, search]);

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') navigate('/dashboard');
    else if (navItem === 'ride-management') navigate('/ride-management');
    else if (navItem === 'courier-management') navigate('/courier-management');
    else if (navItem === 'rental-management') navigate('/rental-management');
    else if (navItem === 'driver-management') navigate('/driver-management');
    else if (navItem === 'user-management') navigate('/user-management');
    else if (navItem === 'marketers') navigate('/marketers');
    else if (navItem === 'influencers') navigate('/influencers');
    else if (navItem === 'financial') navigate('/dashboard?section=financial');
    else if (navItem === 'support') navigate('/dashboard?section=support');
    else if (navItem === 'analytics') navigate('/dashboard?section=analytics');
    else if (navItem === 'reports') navigate('/reports');
    else if (navItem === 'withdrawals') navigate('/withdrawals');
    else if (navItem === 'notifications') navigate('/notifications');
    else if (navItem === 'app-update') navigate('/app-update');
  };

  const handleLogout = async () => {
    if (window.confirm(t('common.confirmLogout'))) {
      try {
        await logoutUser();
        navigate('/login');
      } catch {
        navigate('/login');
      }
    }
  };

  const toggleSidebar = () => setIsSidebarCollapsed((v) => !v);

  const handleAddInfluencer = useCallback(
    async (influencerData) => {
      setIsCreating(true);
      try {
        const result = await createInfluencer(influencerData);
        if (!result.success) {
          setToast({ type: 'error', message: result.error || t('influencers.errorCreate') });
          return;
        }
        setShowModal(false);
        await loadInfluencers();
        setToast({ type: 'success', message: t('influencers.successToast') });
      } finally {
        setIsCreating(false);
      }
    },
    [t, loadInfluencers]
  );

  return (
    <div
      className={`influencers-management grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
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
          <NavItem icon="campaign" label={t('navigation.influencers')} active onClick={() => handleNavClick('influencers')} />
          <NavItem icon="account_balance_wallet" label={t('navigation.financial')} onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label={t('navigation.withdrawals')} onClick={() => handleNavClick('withdrawals')} />
          <NavItem icon="notifications" label={t('navigation.notifications')} onClick={() => handleNavClick('notifications')} />
          <NavItem icon="system_update" label={t('navigation.appUpdate')} onClick={() => handleNavClick('app-update')} />
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
            <img src="https://i.pravatar.cc/80?img=5" alt="" className="avatar" />
            <div className="meta">
              <div className="name">QGlide Admin</div>
              <div className="role">Super Admin</div>
            </div>
            <button className="logout-btn-sidebar" type="button" aria-label={t('common.logout')} onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="top">
          <div className="titles">
            <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1>{t('influencers.title')}</h1>
              <p className="sub">{t('influencers.subtitle')}</p>
            </div>
          </div>
          <div className="acts">
            <ThemeToggle />
            <button className="ibtn" type="button" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <button className="ibtn" type="button" aria-label={t('common.notifications')}>
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" type="button" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="influencers-page-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'accounts'}
              className={`influencers-page-tab ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              <span className="material-symbols-outlined">group</span>
              {t('influencers.tabAccounts')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'analytics'}
              className={`influencers-page-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span className="material-symbols-outlined">insights</span>
              {t('influencers.tabAnalytics')}
            </button>
          </div>

          {activeTab === 'analytics' ? (
            analyticsError && !isAnalyticsLoading && !analyticsData ? (
              <div className="inf-analytics-empty">{analyticsError}</div>
            ) : (
            <InfluencerAnalyticsDashboard
              data={analyticsData}
              isLoading={isAnalyticsLoading}
              period={analyticsPeriod}
              onPeriodChange={setAnalyticsPeriod}
              onInfluencerClick={(id) => navigate(`/influencers/${id}/activity`)}
              t={t}
            />
            )
          ) : (
            <>
          <div className="influencers-toolbar">
            <h2>{t('influencers.listHeading')}</h2>
            <div className="influencers-toolbar-actions">
              <div className="influencers-search">
                <span className="material-symbols-outlined influencers-search-icon">search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('influencers.searchPlaceholder')}
                  aria-label={t('influencers.searchPlaceholder')}
                />
              </div>
              <button type="button" className="btn-add-influencer" onClick={() => setShowModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  person_add
                </span>
                {t('influencers.addInfluencer')}
              </button>
            </div>
          </div>

          <div className="influencers-card">
            {isLoading ? (
              <div className="influencers-panel-state">
                <div className="influencers-loading-spinner" aria-hidden />
                <p className="influencers-panel-message">{t('influencers.loading')}</p>
              </div>
            ) : loadError ? (
              <div className="influencers-panel-state influencers-panel-state-error">
                <span className="material-symbols-outlined influencers-panel-icon">error</span>
                <p className="influencers-panel-title">{t('common.error')}</p>
                <p className="influencers-panel-message">{loadError}</p>
                <button type="button" className="btn-add-influencer influencers-retry-btn" onClick={loadInfluencers}>
                  {t('influencers.retry')}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="influencers-empty">
                <span className="influencers-empty-icon material-symbols-outlined">campaign</span>
                <p className="influencers-empty-title">
                  {influencers.length === 0 ? t('influencers.empty') : t('influencers.noSearchResults')}
                </p>
              </div>
            ) : (
              <div className="influencers-table-wrap">
                <table className="influencers-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('influencers.colEmail')}</th>
                      <th scope="col">{t('influencers.colName')}</th>
                      <th scope="col">{t('influencers.colPhone')}</th>
                      <th scope="col" className="influencers-th-narrow">
                        {t('influencers.colAdded')}
                      </th>
                      <th scope="col" className="influencers-th-actions">{t('influencers.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inf) => (
                      <tr
                        key={inf.id}
                        className="influencers-row-clickable"
                        onClick={() => navigate(`/influencers/${inf.id}/activity`)}
                      >
                        <td className="influencers-cell influencers-cell-email">{inf.email}</td>
                        <td className="influencers-cell influencers-cell-name">{inf.displayName || '—'}</td>
                        <td className="influencers-cell">{inf.phone || '—'}</td>
                        <td className="influencers-cell influencers-cell-date">
                          {(() => {
                            const d = new Date(inf.createdAt);
                            return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
                          })()}
                        </td>
                        <td className="influencers-cell influencers-cell-actions">
                          <button
                            type="button"
                            className="influencers-btn-analytics"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/influencers/${inf.id}/activity`);
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>insights</span>
                            {t('influencers.viewActivity')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </main>

      <AddInfluencerModal
        isOpen={showModal}
        onClose={() => !isCreating && setShowModal(false)}
        onConfirm={handleAddInfluencer}
        isLoading={isCreating}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={5000} />}
    </div>
  );
}
