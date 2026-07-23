import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './MarketersManagementView.css';
import { logoutUser } from '../../services/authService';
import { createMarketer, deleteMarketer, fetchMarketersList, updateMarketer } from '../../services/marketerService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import AddMarketerModal from '../../components/modals/AddMarketerModal';
import EditMarketerModal from '../../components/modals/EditMarketerModal';
import DeleteMarketerModal from '../../components/modals/DeleteMarketerModal';
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

export default function MarketersManagementView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [marketers, setMarketers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMarketer, setEditMarketer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadMarketers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await fetchMarketersList({ page: 1, limit: 50 });
    if (result.success && result.data?.marketers) {
      setMarketers(result.data.marketers);
    } else {
      setLoadError(result.error || t('marketers.errorLoad'));
      setMarketers([]);
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    loadMarketers();
  }, [loadMarketers]);

  const duplicateEmails = useMemo(() => marketers.map((m) => m.email.toLowerCase()), [marketers]);

  const editDuplicateEmails = useMemo(
    () =>
      marketers
        .filter((m) => (editMarketer ? m.id !== editMarketer.id : true))
        .map((m) => m.email.toLowerCase()),
    [marketers, editMarketer]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return marketers;
    return marketers.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.displayName && m.displayName.toLowerCase().includes(q))
    );
  }, [marketers, search]);

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') navigate('/dashboard');
    else if (navItem === 'ride-management') navigate('/ride-management');
    else if (navItem === 'courier-management') navigate('/courier-management');
    else if (navItem === 'rental-management') navigate('/rental-management');
    else if (navItem === 'driver-management') navigate('/driver-management');
    else if (navItem === 'user-management') navigate('/user-management');
    else if (navItem === 'marketers') navigate('/marketers');
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

  const handleAddMarketer = useCallback(
    async ({ email, displayName, password, confirmPassword }) => {
      const result = await createMarketer({
        displayName,
        email,
        password,
        confirmPassword,
      });

      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('marketers.errorCreate') });
        throw new Error(result.error || 'create failed');
      }

      await loadMarketers();
      setToast({ type: 'success', message: t('marketers.successToast') });
    },
    [t, loadMarketers]
  );

  const handleUpdateMarketer = useCallback(
    async ({ marketerId, displayName, email, password, confirmPassword }) => {
      const result = await updateMarketer(marketerId, {
        displayName,
        email,
        password,
        confirmPassword,
      });
      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('marketers.errorUpdate') });
        throw new Error(result.error || 'update failed');
      }
      await loadMarketers();
      setToast({ type: 'success', message: t('marketers.successUpdate') });
    },
    [t, loadMarketers]
  );

  const handleConfirmDelete = useCallback(async (reason) => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteMarketer(deleteTarget.id, reason);
      if (!result.success) {
        setToast({ type: 'error', message: result.error || t('marketers.errorDelete') });
        throw new Error(result.error || 'delete failed');
      }
      await loadMarketers();
      setToast({ type: 'success', message: t('marketers.successDelete') });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadMarketers, t]);

  return (
    <div
      className={`marketers-management grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
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
          <NavItem icon="manage_accounts" label={t('navigation.marketers')} active onClick={() => handleNavClick('marketers')} />
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
              <h1>{t('marketers.title')}</h1>
              <p className="sub">{t('marketers.subtitle')}</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder={t('common.search')} readOnly aria-hidden />
            </div>
            <button type="button" className="chip on">
              EN
            </button>
            <button type="button" className="chip">
              AR
            </button>
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
          <div className="marketers-toolbar">
            <h2>{t('marketers.listHeading')}</h2>
            <div className="marketers-toolbar-actions">
              <div className="marketers-search">
                <span className="material-symbols-outlined marketers-search-icon">search</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('marketers.searchPlaceholder')}
                  aria-label={t('marketers.searchPlaceholder')}
                />
              </div>
              <button type="button" className="btn-add-marketer" onClick={() => setShowModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  person_add
                </span>
                {t('marketers.addMarketer')}
              </button>
            </div>
          </div>

          <div className="marketers-card">
            {isLoading ? (
              <div className="marketers-panel-state">
                <div className="marketers-loading-spinner" aria-hidden />
                <p className="marketers-panel-message">{t('marketers.loading')}</p>
              </div>
            ) : loadError ? (
              <div className="marketers-panel-state marketers-panel-state-error">
                <span className="material-symbols-outlined marketers-panel-icon">error</span>
                <p className="marketers-panel-title">{t('common.error')}</p>
                <p className="marketers-panel-message">{loadError}</p>
                <button type="button" className="btn-add-marketer marketers-retry-btn" onClick={loadMarketers}>
                  {t('marketers.retry')}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="marketers-empty">
                <span className="marketers-empty-icon material-symbols-outlined">groups</span>
                <p className="marketers-empty-title">
                  {marketers.length === 0 ? t('marketers.empty') : t('marketers.noSearchResults')}
                </p>
              </div>
            ) : (
              <div className="marketers-table-wrap">
                <table className="marketers-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('marketers.colEmail')}</th>
                      <th scope="col">{t('marketers.colName')}</th>
                      <th scope="col">{t('marketers.colPassword')}</th>
                      <th scope="col" className="marketers-th-narrow">
                        {t('marketers.colAdded')}
                      </th>
                      <th scope="col" className="marketers-th-actions">
                        {t('marketers.colActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id}>
                        <td className="marketers-cell marketers-cell-email">{m.email}</td>
                        <td className="marketers-cell marketers-cell-name">{m.displayName || '—'}</td>
                        <td className="marketers-cell">
                          <span className="marketers-pill">{t('marketers.passwordNotStored')}</span>
                        </td>
                        <td className="marketers-cell marketers-cell-date">
                          {(() => {
                            const d = new Date(m.createdAt);
                            return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
                          })()}
                        </td>
                        <td className="marketers-cell marketers-cell-actions">
                          <div className="marketers-row-actions">
                            <button
                              type="button"
                              className="marketers-btn marketers-btn-edit"
                              onClick={() => setEditMarketer(m)}
                            >
                              <span className="material-symbols-outlined" aria-hidden>
                                edit
                              </span>
                              {t('marketers.update')}
                            </button>
                            <button
                              type="button"
                              className="marketers-btn marketers-btn-delete"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <span className="material-symbols-outlined" aria-hidden>
                                delete
                              </span>
                              {t('marketers.delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AddMarketerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        duplicateEmails={duplicateEmails}
        onConfirm={handleAddMarketer}
      />

      <EditMarketerModal
        isOpen={!!editMarketer}
        marketer={editMarketer}
        onClose={() => setEditMarketer(null)}
        duplicateEmails={editDuplicateEmails}
        onConfirm={handleUpdateMarketer}
      />

      <DeleteMarketerModal
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
