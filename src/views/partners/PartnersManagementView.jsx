import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './PartnersManagementView.css';
import { logoutUser } from '../../services/authService';
import {
  createPartner,
  deletePartner,
  fetchPartnersList,
  updatePartner,
} from '../../services/partnerService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageToggle from '../../components/common/LanguageToggle';
import LazyLoader from '../../components/common/LazyLoader.jsx';
import AddPartnerModal from '../../components/modals/AddPartnerModal';
import EditPartnerModal from '../../components/modals/EditPartnerModal';
import DeletePartnerModal from '../../components/modals/DeletePartnerModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import NotificationBell from '../../components/common/NotificationBell';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const getCategoryLabelKey = (category) => {
  switch (String(category || '').toLowerCase()) {
    case 'limousine':
      return 'partners.categoryLimousine';
    case 'restaurant':
      return 'partners.categoryRestaurant';
    case 'club':
      return 'partners.categoryClub';
    case 'bar':
      return 'partners.categoryBar';
    default:
      return null;
  }
};

export default function PartnersManagementView() {
  const navigate = useNavigate();
  const { t, formatDateTime } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPartner, setEditPartner] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadPartners = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await fetchPartnersList({ page: 1, limit: 50 });
    if (result.success && result.data?.partners) {
      setPartners(result.data.partners);
    } else {
      setLoadError(result.error || t('partners.errorLoad'));
      setPartners([]);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const duplicateEmails = useMemo(() => partners.map((partner) => partner.email.toLowerCase()), [partners]);

  const editDuplicateEmails = useMemo(
    () =>
      partners
        .filter((partner) => (editPartner ? partner.id !== editPartner.id : true))
        .map((partner) => partner.email.toLowerCase()),
    [partners, editPartner]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (partner) =>
        partner.email.toLowerCase().includes(q)
        || (partner.displayName && partner.displayName.toLowerCase().includes(q))
        || (partner.legalName && partner.legalName.toLowerCase().includes(q))
        || (partner.partnerCode && partner.partnerCode.toLowerCase().includes(q))
        || (partner.category && partner.category.toLowerCase().includes(q))
    );
  }, [partners, search]);

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

  const toggleSidebar = () => setIsSidebarCollapsed((value) => !value);

  const handleAddPartner = useCallback(
    async ({ category, displayName, legalName, email }) => {
      const result = await createPartner({
        category,
        displayName,
        legalName,
        email,
      });

      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('partners.errorCreate') });
        throw new Error(result.error || 'create failed');
      }

      setPartners((prev) => [result.data, ...prev]);
      setToast({ type: 'success', message: t('partners.successToast') });
    },
    [t]
  );

  const handleUpdatePartner = useCallback(
    async ({ partnerId, category, displayName, legalName, email }) => {
      const result = await updatePartner(partnerId, {
        category,
        displayName,
        legalName,
        email,
      });
      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('partners.errorUpdate') });
        throw new Error(result.error || 'update failed');
      }
      setPartners((prev) => prev.map((partner) => (
        partner.id === partnerId ? result.data : partner
      )));
      setToast({ type: 'success', message: t('partners.successUpdate') });
    },
    [t]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deletePartner(deleteTarget.id);
      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('partners.errorDelete') });
        throw new Error(result.error || 'delete failed');
      }
      setPartners((prev) => prev.filter((partner) => partner.id !== deleteTarget.id));
      setToast({ type: 'success', message: t('partners.successDelete') });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, t]);

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
          <NavItem icon="notifications" label="Notifications" onClick={() => handleNavClick('notifications')} />
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
              <h1>{t('partners.title')}</h1>
              <p className="sub">{t('partners.subtitle')}</p>
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
          <div className="partners-toolbar">
            <h2>{t('partners.listHeading')}</h2>
            <div className="partners-toolbar-actions">
              <div className="partners-search">
                <span className="material-symbols-outlined partners-search-icon">search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('partners.searchPlaceholder')}
                  aria-label={t('partners.searchPlaceholder')}
                />
              </div>
              <button type="button" className="btn-add-partner" onClick={() => setShowModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  store
                </span>
                {t('partners.addPartner')}
              </button>
            </div>
          </div>

          <div className="partners-card">
            {isLoading ? (
              <LazyLoader variant="table" rows={6} columns={6} message={t('partners.loading')} />
            ) : loadError ? (
              <div className="partners-panel-state partners-panel-state-error">
                <span className="material-symbols-outlined partners-panel-icon">error</span>
                <p className="partners-panel-title">{t('common.error')}</p>
                <p className="partners-panel-message">{loadError}</p>
                <button type="button" className="btn-add-partner partners-retry-btn" onClick={loadPartners}>
                  {t('partners.retry')}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="partners-empty">
                <span className="partners-empty-icon material-symbols-outlined">handshake</span>
                <p className="partners-empty-title">
                  {partners.length === 0 ? t('partners.empty') : t('partners.noSearchResults')}
                </p>
              </div>
            ) : (
              <div className="partners-table-wrap">
                <table className="partners-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('partners.colBusiness')}</th>
                      <th scope="col">{t('partners.colCategory')}</th>
                      <th scope="col">{t('partners.colCode')}</th>
                      <th scope="col">{t('partners.colEmail')}</th>
                      <th scope="col" className="partners-th-narrow">{t('partners.colAdded')}</th>
                      <th scope="col" className="partners-th-actions">{t('partners.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((partner) => {
                      const categoryLabelKey = getCategoryLabelKey(partner.category);
                      return (
                        <tr key={partner.id}>
                          <td className="partners-cell partners-cell-name">
                            <div className="partners-business-cell">
                              <strong>{partner.displayName || '—'}</strong>
                              {partner.legalName ? (
                                <span className="partners-legal-name">{partner.legalName}</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="partners-cell">
                            <span className="partner-category-badge">
                              {categoryLabelKey ? t(categoryLabelKey) : partner.category || '—'}
                            </span>
                          </td>
                          <td className="partners-cell">
                            {partner.partnerCode ? (
                              <span className="partner-code-pill">{partner.partnerCode}</span>
                            ) : (
                              <span className="partners-pill">{t('partners.codePending')}</span>
                            )}
                          </td>
                          <td className="partners-cell partners-cell-email">{partner.email}</td>
                          <td className="partners-cell partners-cell-date">
                            {(() => {
                              const d = new Date(partner.createdAt);
                              return Number.isNaN(d.getTime()) ? '—' : formatDateTime(d);
                            })()}
                          </td>
                          <td className="partners-cell partners-cell-actions">
                            <div className="partners-row-actions">
                              <button
                                type="button"
                                className="partners-btn partners-btn-edit"
                                onClick={() => setEditPartner(partner)}
                              >
                                <span className="material-symbols-outlined" aria-hidden>
                                  edit
                                </span>
                                {t('partners.update')}
                              </button>
                              <button
                                type="button"
                                className="partners-btn partners-btn-delete"
                                onClick={() => setDeleteTarget(partner)}
                              >
                                <span className="material-symbols-outlined" aria-hidden>
                                  delete
                                </span>
                                {t('partners.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddPartnerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        duplicateEmails={duplicateEmails}
        onConfirm={handleAddPartner}
      />

      <EditPartnerModal
        isOpen={!!editPartner}
        partner={editPartner}
        onClose={() => setEditPartner(null)}
        duplicateEmails={editDuplicateEmails}
        onConfirm={handleUpdatePartner}
      />

      <DeletePartnerModal
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        email={deleteTarget?.email}
        displayName={deleteTarget?.displayName}
        isLoading={isDeleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={5000} />}
    </div>
  );
}
