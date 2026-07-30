import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../influencers/InfluencersManagementView.css';
import '../../components/influencers/InfluencerAnalytics.css';
import { logoutUser } from '../../services/authService';
import { fetchInfluencersList } from '../../services/influencerService';
import { fetchInfluencerDetailAnalytics } from '../../services/influencerAnalytics';
import {
  LineAreaChart,
  VerticalBarChart,
  DonutChart,
  formatNumber,
} from '../../components/influencers/InfluencerAnalyticsDashboard';
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

function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'status-completed';
  if (s === 'signed up') return 'status-signed';
  return 'status-pending';
}

export default function InfluencerDetailView() {
  const { influencerId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [influencer, setInfluencer] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const listResult = await fetchInfluencersList({ page: 1, limit: 100 });
    let found =
      listResult.success && listResult.data?.influencers
        ? listResult.data.influencers.find((inf) => inf.id === influencerId)
        : null;

    if (!found) {
      found = {
        id: influencerId,
        displayName: t('influencers.unknownInfluencer'),
        email: '—',
        phone: '—',
      };
    }

    setInfluencer(found);

    const analyticsResult = await fetchInfluencerDetailAnalytics(influencerId, found, { period });
    if (analyticsResult.success && analyticsResult.data) {
      setAnalytics(analyticsResult.data);
      if (analyticsResult.data.influencer) {
        setInfluencer((prev) => ({
          ...prev,
          ...analyticsResult.data.influencer,
          displayName:
            analyticsResult.data.influencer.displayName &&
            analyticsResult.data.influencer.displayName !== '—'
              ? analyticsResult.data.influencer.displayName
              : prev?.displayName,
        }));
      }
    } else {
      setAnalytics(null);
      setLoadError(analyticsResult.error || t('influencers.analyticsNoData'));
    }
    setIsLoading(false);
  }, [influencerId, period, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const summary = analytics?.summary;
  const displayName =
    influencer?.displayName && influencer.displayName !== '—'
      ? influencer.displayName
      : influencer?.email || t('influencers.unknownInfluencer');
  const initial = displayName.charAt(0).toUpperCase();

  const referralSegments =
    analytics?.referralStatus?.length > 0
      ? analytics.referralStatus.map((seg) => ({
          label: seg.label,
          count: seg.count,
          percentage: seg.percentage,
          color: seg.color,
        }))
      : summary
        ? [
            {
              label: t('influencers.statusCompleted'),
              count: summary.completedReferrals,
              percentage: summary.totalReferrals
                ? Math.round((summary.completedReferrals / summary.totalReferrals) * 100)
                : 0,
              color: '#7c3aed',
            },
            {
              label: t('influencers.statusSignedUp'),
              count: summary.signedUpOnly,
              percentage: summary.totalReferrals
                ? Math.round((summary.signedUpOnly / summary.totalReferrals) * 100)
                : 0,
              color: '#a78bfa',
            },
            {
              label: t('influencers.statusPending'),
              count: summary.pendingReferrals,
              percentage: summary.totalReferrals
                ? Math.round((summary.pendingReferrals / summary.totalReferrals) * 100)
                : 0,
              color: '#ddd6fe',
            },
          ].filter((s) => s.count > 0)
        : [];

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
            <button
              className="sidebar-toggle"
              type="button"
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1>{t('influencers.detailTitle')}</h1>
              <p className="sub">{t('influencers.detailSubtitle')}</p>
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
          <button type="button" className="influencer-detail-back" onClick={() => navigate('/influencers')}>
            <span className="material-symbols-outlined">arrow_back</span>
            {t('influencers.backToList')}
          </button>

          {isLoading ? (
            <div className="inf-analytics-loading">
              <div className="influencers-loading-spinner" aria-hidden />
              <p>{t('influencers.analyticsLoading')}</p>
            </div>
          ) : loadError ? (
            <div className="inf-analytics-empty">{loadError}</div>
          ) : (
            <>
              <div className="influencer-detail-header">
                <div className="influencer-detail-profile">
                  <div className="influencer-detail-avatar">{initial}</div>
                  <div>
                    <h1>{displayName}</h1>
                    <p>{influencer?.email}</p>
                    {influencer?.phone && influencer.phone !== '—' ? <p>{influencer.phone}</p> : null}
                    {summary?.lastLogin ? (
                      <p>
                        {t('influencers.lastLogin')}: {new Date(summary.lastLogin).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="inf-period-tabs">
                  {[
                    { id: '7d', label: t('influencers.period7d') },
                    { id: '30d', label: t('influencers.period30d') },
                    { id: '90d', label: t('influencers.period90d') },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`inf-period-tab ${period === p.id ? 'active' : ''}`}
                      onClick={() => setPeriod(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {analytics?.isDemo ? (
                <div className="inf-demo-banner" style={{ marginBottom: 16 }}>
                  <span className="material-symbols-outlined">info</span>
                  {t('influencers.demoDataNotice')}
                </div>
              ) : null}

              <div className="influencer-detail-mini-metrics">
                <div className="influencer-detail-mini-card">
                  <span>{t('influencers.metricTotalReferrals')}</span>
                  <strong>{formatNumber(summary?.totalReferrals ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('influencers.metricLoginsToday')}</span>
                  <strong>{formatNumber(summary?.loginsToday ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('influencers.metricLoginsMonth')}</span>
                  <strong>{formatNumber(summary?.loginsThisMonth ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('influencers.metricConversion')}</span>
                  <strong>{summary?.conversionRate ?? 0}%</strong>
                </div>
              </div>

              <section className="inf-charts-row inf-charts-row-2">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.chartReferralsOverTime')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <LineAreaChart data={analytics?.referralsOverTime} color="#7c3aed" />
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.chartLoginsOverTime')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <LineAreaChart data={analytics?.loginsOverTime} color="#6366f1" />
                  </div>
                </div>
              </section>

              <section className="inf-charts-row inf-charts-row-2">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.chartLoginsByHour')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <VerticalBarChart data={analytics?.loginsByHour} />
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.chartReferralStatus')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <DonutChart segments={referralSegments} />
                  </div>
                </div>
              </section>

              <div className="influencer-detail-lists">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.recentReferrals')}</h3>
                  </div>
                  <div className="inf-chart-body inf-table-wrap">
                    {analytics?.recentReferrals?.length ? (
                    <table className="influencer-referrals-table">
                      <thead>
                        <tr>
                          <th>{t('influencers.colUser')}</th>
                          <th>{t('influencers.colStatus')}</th>
                          <th>{t('influencers.colDate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentReferrals.map((ref) => (
                          <tr key={ref.id}>
                            <td>{ref.user}</td>
                            <td className={statusClass(ref.status)}>{ref.status}</td>
                            <td>{ref.date ? new Date(ref.date).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    ) : (
                      <p className="inf-chart-empty">{t('influencers.noReferrals')}</p>
                    )}
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('influencers.loginHistory')}</h3>
                  </div>
                  <div className="inf-chart-body inf-table-wrap">
                    {analytics?.loginHistory?.length ? (
                    <table className="influencer-logins-table">
                      <thead>
                        <tr>
                          <th>{t('influencers.colDate')}</th>
                          <th>{t('influencers.colDevice')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.loginHistory.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date ? new Date(entry.date).toLocaleString() : '—'}</td>
                            <td>{entry.device}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    ) : (
                      <p className="inf-chart-empty">{t('influencers.noLogins')}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
