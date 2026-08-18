import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PartnersManagementView.css';
import '../../components/influencers/InfluencerAnalytics.css';
import { logoutUser } from '../../services/authService';
import { fetchPartnersList, PARTNER_CATEGORIES } from '../../services/partnerService';
import { fetchPartnerDetailAnalytics } from '../../services/partnerAnalytics';
import {
  LineAreaChart,
  VerticalBarChart,
  DonutChart,
} from '../../components/influencers/InfluencerAnalyticsDashboard';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageToggle from '../../components/common/LanguageToggle';
import LazyLoader from '../../components/common/LazyLoader.jsx';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import NotificationBell from '../../components/common/NotificationBell';
import PartnerCodesModal from '../../components/modals/PartnerCodesModal';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

function getCategoryLabelKey(category) {
  const match = PARTNER_CATEGORIES.find((c) => c.value === String(category || '').toLowerCase());
  return match?.labelKey ?? null;
}

function attributionStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return 'status-completed';
  if (s.includes('register')) return 'status-signed';
  if (s.includes('download')) return 'status-pending';
  return 'status-pending';
}

function rewardStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('redeem')) return 'status-completed';
  if (s.includes('expir') || s.includes('revok')) return 'status-pending';
  return 'status-signed';
}

export default function PartnerDetailView() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { t, formatNumber, formatDate, translateApiLabel } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [partner, setPartner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showCodesModal, setShowCodesModal] = useState(false);

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') navigate('/dashboard');
    else if (navItem === 'ride-management') navigate('/ride-management');
    else if (navItem === 'courier-management') navigate('/courier-management');
    else if (navItem === 'rental-management') navigate('/rental-management');
    else if (navItem === 'driver-management') navigate('/driver-management');
    else if (navItem === 'marketers') navigate('/marketers');
    else if (navItem === 'partners') navigate('/partners');
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

    const listResult = await fetchPartnersList();
    let found =
      listResult.success && listResult.data?.partners
        ? listResult.data.partners.find((p) => p.id === partnerId)
        : null;

    if (!found) {
      found = {
        id: partnerId,
        displayName: t('partners.unknownPartner'),
        email: '—',
        category: 'restaurant',
        partnerCode: '—',
      };
    }

    setPartner(found);

    const analyticsResult = await fetchPartnerDetailAnalytics(partnerId, found, { period });
    if (analyticsResult.success && analyticsResult.data) {
      setAnalytics(analyticsResult.data);
      if (analyticsResult.data.partner) {
        setPartner((prev) => ({
          ...prev,
          ...analyticsResult.data.partner,
          displayName:
            analyticsResult.data.partner.displayName &&
            analyticsResult.data.partner.displayName !== '—'
              ? analyticsResult.data.partner.displayName
              : prev?.displayName,
        }));
      }
    } else {
      setAnalytics(null);
      setLoadError(analyticsResult.error || t('partners.analyticsNoData'));
    }
    setIsLoading(false);
  }, [partnerId, period, t]);

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
  const category = partner?.category || analytics?.partner?.category || '';
  const categoryLabelKey = getCategoryLabelKey(category);
  const isLimousine = String(category).toLowerCase() === 'limousine';
  const displayName =
    partner?.displayName && partner.displayName !== '—'
      ? partner.displayName
      : partner?.email || t('partners.unknownPartner');
  const initial = displayName.charAt(0).toUpperCase();

  const funnelSegments =
    analytics?.funnelStatus?.length > 0
      ? analytics.funnelStatus.map((seg) => ({
          label: translateApiLabel(seg.label),
          count: seg.count,
          percentage: seg.percentage,
          color: seg.color,
        }))
      : [];

  return (
    <div
      className={`partners-management grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="manage_accounts" label={t('navigation.marketers')} onClick={() => handleNavClick('marketers')} />
          <NavItem icon="handshake" label={t('navigation.partners')} active onClick={() => handleNavClick('partners')} />
          <NavItem icon="campaign" label={t('navigation.influencers')} onClick={() => handleNavClick('influencers')} />
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
              <h1>{t('partners.detailTitle')}</h1>
              <p className="sub">{t('partners.detailSubtitle')}</p>
            </div>
          </div>
          <div className="acts">
            <LanguageToggle />
            <ThemeToggle />
            <button className="ibtn" type="button" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <NotificationBell />
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" type="button" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <button type="button" className="influencer-detail-back" onClick={() => navigate('/partners')}>
            <span className="material-symbols-outlined">arrow_back</span>
            {t('partners.backToList')}
          </button>

          {isLoading ? (
            <LazyLoader variant="cards" count={4} message={t('partners.analyticsLoading')} />
          ) : loadError ? (
            <div className="inf-analytics-empty">
              <p>{loadError}</p>
              <button type="button" className="partners-btn-codes" onClick={loadData}>
                {t('partners.retry')}
              </button>
            </div>
          ) : (
            <>
              <div className="influencer-detail-header">
                <div className="influencer-detail-profile">
                  <div className="influencer-detail-avatar partner-detail-avatar">{initial}</div>
                  <div>
                    <h1>{displayName}</h1>
                    {partner?.legalName ? <p>{partner.legalName}</p> : null}
                    <p>{partner?.email}</p>
                    <div className="partner-detail-meta">
                      {categoryLabelKey ? (
                        <span className="partner-category-badge">{t(categoryLabelKey)}</span>
                      ) : null}
                      {partner?.partnerCode && partner.partnerCode !== '—' ? (
                        <span className="partner-code-pill">{partner.partnerCode}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="partner-detail-header-actions">
                  <button
                    type="button"
                    className="partners-btn-codes partner-detail-codes-btn"
                    onClick={() => setShowCodesModal(true)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>qr_code_2</span>
                    {t('partners.manageCodes')}
                  </button>
                  <div className="inf-period-tabs">
                  {[
                    { id: '7d', label: t('partners.period7d') },
                    { id: '30d', label: t('partners.period30d') },
                    { id: '90d', label: t('partners.period90d') },
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
              </div>

              {analytics?.isDemo ? (
                <div className="inf-demo-banner" style={{ marginBottom: 16 }}>
                  <span className="material-symbols-outlined">info</span>
                  {t('partners.demoDataNotice')}
                </div>
              ) : null}

              <div className="influencer-detail-mini-metrics">
                <div className="influencer-detail-mini-card">
                  <span>{t('partners.metricScans')}</span>
                  <strong>{formatNumber(summary?.scans ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('partners.metricRegistrations')}</span>
                  <strong>{formatNumber(summary?.registrations ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('partners.metricCompletedRides')}</span>
                  <strong>{formatNumber(summary?.completedRides ?? 0)}</strong>
                </div>
                <div className="influencer-detail-mini-card">
                  <span>{t('partners.metricActivationRate')}</span>
                  <strong>{summary?.activationRate ?? 0}%</strong>
                </div>
                {isLimousine ? (
                  <>
                    <div className="influencer-detail-mini-card">
                      <span>{t('partners.metricDriversSupplied')}</span>
                      <strong>{formatNumber(summary?.driversSupplied ?? 0)}</strong>
                    </div>
                    <div className="influencer-detail-mini-card">
                      <span>{t('partners.metricCommissionEarned')}</span>
                      <strong>QAR {formatNumber(summary?.commissionEarned ?? 0)}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="influencer-detail-mini-card">
                      <span>{t('partners.metricRewardsIssued')}</span>
                      <strong>{formatNumber(summary?.rewardsIssued ?? 0)}</strong>
                    </div>
                    <div className="influencer-detail-mini-card">
                      <span>{t('partners.metricRewardsRedeemed')}</span>
                      <strong>{formatNumber(summary?.rewardsRedeemed ?? 0)}</strong>
                    </div>
                  </>
                )}
              </div>

              <section className="inf-charts-row inf-charts-row-2">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.chartScansOverTime')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <LineAreaChart data={analytics?.scansOverTime} color="#0d9488" />
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.chartRidesOverTime')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <LineAreaChart data={analytics?.ridesOverTime} color="#6366f1" />
                  </div>
                </div>
              </section>

              <section className="inf-charts-row inf-charts-row-2">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.chartActivityByHour')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <VerticalBarChart data={analytics?.activityByHour} color="#14b8a6" />
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.chartAttributionFunnel')}</h3>
                  </div>
                  <div className="inf-chart-body">
                    <DonutChart segments={funnelSegments} />
                  </div>
                </div>
              </section>

              <div className="influencer-detail-lists">
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.recentAttributions')}</h3>
                  </div>
                  <div className="inf-chart-body inf-table-wrap">
                    {analytics?.recentAttributions?.length ? (
                      <table className="influencer-referrals-table">
                        <thead>
                          <tr>
                            <th>{t('partners.colUser')}</th>
                            <th>{t('partners.colUserType')}</th>
                            <th>{t('partners.colStatus')}</th>
                            <th>{t('partners.colDate')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentAttributions.map((row) => (
                            <tr key={row.id}>
                              <td>{row.user}</td>
                              <td>{translateApiLabel(row.userType)}</td>
                              <td className={attributionStatusClass(row.status)}>
                                {translateApiLabel(row.status)}
                              </td>
                              <td>{row.date ? formatDate(row.date) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="inf-chart-empty">{t('partners.noAttributions')}</p>
                    )}
                  </div>
                </div>
                <div className="inf-chart-panel">
                  <div className="inf-chart-header">
                    <h3>{t('partners.recentRewards')}</h3>
                  </div>
                  <div className="inf-chart-body inf-table-wrap">
                    {analytics?.recentRewards?.length ? (
                      <table className="influencer-logins-table">
                        <thead>
                          <tr>
                            <th>{t('partners.colReward')}</th>
                            <th>{t('partners.colUser')}</th>
                            <th>{t('partners.colStatus')}</th>
                            <th>{t('partners.colDate')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentRewards.map((row) => (
                            <tr key={row.id}>
                              <td>{translateApiLabel(row.reward)}</td>
                              <td>{row.user}</td>
                              <td className={rewardStatusClass(row.status)}>
                                {translateApiLabel(row.status)}
                              </td>
                              <td>{row.date ? formatDate(row.date) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="inf-chart-empty">{t('partners.noRewards')}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <PartnerCodesModal
        isOpen={showCodesModal}
        partner={partner}
        onClose={() => setShowCodesModal(false)}
        onGenerated={(generated) => {
          if (generated?.code) {
            setPartner((prev) => (prev ? { ...prev, partnerCode: generated.code } : prev));
          }
        }}
      />
    </div>
  );
}
