import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverManagementView.css';
import { logoutUser } from '../../services/authService';
import {
  fetchDriversList,
  fetchAllDriversList,
  fetchDriverWalletsForIds,
  transformDriverData,
  exportDriversToPDF,
  matchesDriverFilters,
  isPresenceStatusFilter,
} from '../../services/driverService';
import { detectNewlyOnlineDrivers } from '../../utils/driverOnlineState';
import UserAvatar from '../../components/common/UserAvatar';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageToggle from '../../components/common/LanguageToggle';
import LazyLoader from '../../components/common/LazyLoader.jsx';
import { useLanguage } from '../../contexts/LanguageContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import NotificationBell from '../../components/common/NotificationBell';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const { translateApiLabel } = useLanguage();
  const getStatusClass = (status) => {
    if (!status) return 'driver-status-offline';
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'driver-status-active';
      case 'offline': return 'driver-status-offline';
      case 'suspended': return 'driver-status-suspended';
      default: return 'driver-status-offline';
    }
  };

  return <span className={`driver-status-badge ${getStatusClass(status)}`}>{translateApiLabel(status || 'pending')}</span>;
};

export default function DriverManagementView() {
  const navigate = useNavigate();
  const { t, formatNumber, formatCurrency } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // API-related state
  const [drivers, setDrivers] = useState([]);
  const [driverWallets, setDriverWallets] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [ratingFilter, setRatingFilter] = useState('Any Rating');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const loadRequestIdRef = useRef(0);
  const pollRequestIdRef = useRef(0);
  const driverStatusMapRef = useRef(new Map());
  const pollFiltersRef = useRef({});
  const isLoadingRef = useRef(false);
  const allFilteredDriversRef = useRef([]);

  isLoadingRef.current = isLoading;
  pollFiltersRef.current = {
    searchTerm,
    statusFilter,
    ratingFilter,
    currentPage,
    startDate,
    endDate,
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const applyFilteredDriverPage = useCallback((filteredDrivers, page) => {
    allFilteredDriversRef.current = filteredDrivers;

    const total = filteredDrivers.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), pages);

    setTotalCount(total);
    setTotalPages(pages);
    setCurrentPage(safePage);
    setDrivers(filteredDrivers.slice((safePage - 1) * limit, safePage * limit));

    return filteredDrivers.slice((safePage - 1) * limit, safePage * limit);
  }, [limit]);

  const loadDriverWallets = useCallback(async (pageDrivers, requestId) => {
    if (!pageDrivers.length) {
      if (requestId === loadRequestIdRef.current) {
        setDriverWallets({});
      }
      return;
    }

    const walletResult = await fetchDriverWalletsForIds(
      pageDrivers.map((driver) => driver.id),
    );

    if (requestId === loadRequestIdRef.current && walletResult.success) {
      setDriverWallets(walletResult.walletByDriverId);
    }
  }, []);

  // Fetch drivers from API
  const loadDrivers = useCallback(async (search = '', status = '', rating = '', page = 1, start = '', end = '', { silent = false } = {}) => {
    const requestId = ++loadRequestIdRef.current;
    const usePresencePagination = isPresenceStatusFilter(status);

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      if (usePresencePagination) {
        const result = await fetchAllDriversList(search, status, rating, start, end);

        if (requestId !== loadRequestIdRef.current) {
          return;
        }

        if (result.success) {
          const filterOptions = {
            searchTerm: search,
            statusFilter: status,
            ratingFilter: rating,
            applyStatusFilter: true,
          };
          const filteredDrivers = result.drivers
            .map(transformDriverData)
            .filter((driver) => matchesDriverFilters(driver, filterOptions));

          const pageDrivers = applyFilteredDriverPage(filteredDrivers, page);

          detectNewlyOnlineDrivers(filteredDrivers);
          pageDrivers.forEach((driver) => {
            driverStatusMapRef.current.set(String(driver.id), driver.status);
          });

          await loadDriverWallets(pageDrivers, requestId);
        } else if (!silent) {
          setError(result.error || 'Failed to load drivers');
        }

        return;
      }

      allFilteredDriversRef.current = [];

      const result = await fetchDriversList(search, status, rating, page, limit, start, end);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (!silent) {
        console.log('📡 API RESULT RECEIVED:', {
          '✅ Success': result.success,
          '📊 Has Data': !!result.data,
          '📝 Error': result.error,
        });
      }

      if (result.success && result.data) {
        const driversArray = Array.isArray(result.data.drivers) ? result.data.drivers : [];
        const transformedDrivers = driversArray.map(transformDriverData);

        setDrivers(transformedDrivers);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        setCurrentPage(result.data.currentPage || page);

        detectNewlyOnlineDrivers(transformedDrivers);

        transformedDrivers.forEach((driver) => {
          driverStatusMapRef.current.set(String(driver.id), driver.status);
        });

        await loadDriverWallets(transformedDrivers, requestId);
      } else if (!silent) {
        setError(result.error || 'Failed to load drivers');
      }
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      if (!silent) {
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      if (requestId === loadRequestIdRef.current && !silent) {
        setIsLoading(false);
      }
    }
  }, [applyFilteredDriverPage, limit, loadDriverWallets]);

  // Debounced search and filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 SEARCH/FILTER TRIGGERED:', {
        '📝 Search Term': searchTerm,
        '📊 Status Filter': statusFilter,
        '⭐ Rating Filter': ratingFilter,
        '📅 Start Date': startDate,
        '📅 End Date': endDate,
        '⏰ Timestamp': new Date().toISOString()
      });
      loadDrivers(searchTerm, statusFilter, ratingFilter, 1, startDate, endDate);
      setCurrentPage(1);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, ratingFilter, startDate, endDate, loadDrivers]);

  const pollDriverOnlineStatuses = useCallback(async () => {
    if (document.hidden || isLoadingRef.current) {
      return;
    }

    const {
      searchTerm: search,
      statusFilter: status,
      ratingFilter: rating,
      currentPage: page,
      startDate: start,
      endDate: end,
    } = pollFiltersRef.current;

    const requestId = ++pollRequestIdRef.current;
    const usePresencePagination = isPresenceStatusFilter(status);

    try {
      if (usePresencePagination) {
        const result = await fetchAllDriversList(search, status, rating, start, end);
        if (requestId !== pollRequestIdRef.current || !result.success) {
          return;
        }

        const filterOptions = {
          searchTerm: search,
          statusFilter: status,
          ratingFilter: rating,
          applyStatusFilter: true,
        };
        const filteredDrivers = result.drivers
          .map(transformDriverData)
          .filter((driver) => matchesDriverFilters(driver, filterOptions));

        filteredDrivers.forEach((driver) => {
          driverStatusMapRef.current.set(String(driver.id), driver.status);
        });

        detectNewlyOnlineDrivers(filteredDrivers);
        applyFilteredDriverPage(filteredDrivers, page);
        return;
      }

      const result = await fetchDriversList(search, status, rating, page, limit, start, end);
      if (requestId !== pollRequestIdRef.current || !result.success || !result.data) {
        return;
      }

      const driversArray = Array.isArray(result.data.drivers) ? result.data.drivers : [];
      const freshDrivers = driversArray.map(transformDriverData);

      freshDrivers.forEach((driver) => {
        driverStatusMapRef.current.set(String(driver.id), driver.status);
      });

      detectNewlyOnlineDrivers(freshDrivers);

      setDrivers((prev) => {
        if (!prev.length) {
          return prev;
        }

        const freshDriverById = new Map(freshDrivers.map((driver) => [driver.id, driver]));

        let changed = false;
        const next = prev.map((driver) => {
          const freshDriver = freshDriverById.get(driver.id);
          if (!freshDriver) {
            return driver;
          }

          if (
            freshDriver.status === driver.status &&
            freshDriver.isOnline === driver.isOnline
          ) {
            return driver;
          }

          changed = true;
          return {
            ...driver,
            status: freshDriver.status,
            isOnline: freshDriver.isOnline,
          };
        });

        return changed ? next : prev;
      });
    } catch {
      // Ignore background poll errors
    }
  }, [applyFilteredDriverPage, limit]);

  useEffect(() => {
    const intervalId = setInterval(pollDriverOnlineStatuses, 2000);
    return () => {
      pollRequestIdRef.current += 1;
      clearInterval(intervalId);
    };
  }, [pollDriverOnlineStatuses]);

  // Fallback: Initialize with empty array if no drivers loaded after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (drivers.length === 0 && !isLoading && !error) {
        console.log('⚠️ No drivers loaded, initializing with empty array');
        setDrivers([]);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [drivers.length, isLoading, error]);

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
    }
    else if (navItem === 'partners') navigate('/partners'); else if (navItem === 'influencers') {
      navigate('/influencers');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
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
    } else if (navItem === 'app-update') {
      navigate('/app-update');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logoutUser();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All Statuses');
    setRatingFilter('Any Rating');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    allFilteredDriversRef.current = [];
  };

  const changePresenceFilterPage = useCallback(async (newPage) => {
    const pageDrivers = applyFilteredDriverPage(allFilteredDriversRef.current, newPage);
    const requestId = loadRequestIdRef.current;

    setIsLoading(true);

    try {
      await loadDriverWallets(pageDrivers, requestId);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyFilteredDriverPage, loadDriverWallets]);

  // Handle PDF export
  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const result = await exportDriversToPDF(statusFilter, ratingFilter, startDate, endDate);

      if (!result.success) {
        console.error('❌ Export failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (isPresenceStatusFilter(statusFilter)) {
        changePresenceFilterPage(newPage);
        return;
      }

      setCurrentPage(newPage);
      loadDrivers(searchTerm, statusFilter, ratingFilter, newPage, startDate, endDate);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;

      if (isPresenceStatusFilter(statusFilter)) {
        changePresenceFilterPage(newPage);
        return;
      }

      setCurrentPage(newPage);
      loadDrivers(searchTerm, statusFilter, ratingFilter, newPage, startDate, endDate);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;

      if (isPresenceStatusFilter(statusFilter)) {
        changePresenceFilterPage(newPage);
        return;
      }

      setCurrentPage(newPage);
      loadDrivers(searchTerm, statusFilter, ratingFilter, newPage, startDate, endDate);
    }
  };

  const handleDriverClick = (driverId) => {
    navigate(`/driver-profile/${driverId}`);
  };

  const usesClientPresencePagination = isPresenceStatusFilter(statusFilter);

  // Online/offline uses client-side pagination; other filters may still refine the current page.
  const filteredDrivers = usesClientPresencePagination
    ? drivers
    : drivers.filter((driver) =>
        matchesDriverFilters(driver, {
          searchTerm,
          statusFilter,
          ratingFilter,
          applyStatusFilter: true,
        })
      );

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'All Statuses' ||
    ratingFilter !== 'Any Rating' ||
    startDate ||
    endDate
  );
  const isInitialLoading = isLoading && drivers.length === 0 && !error && !hasActiveFilters;
  const isSearching = isLoading && !isInitialLoading;

  return (
    <div className={`driver-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} active={true} />
          <NavItem icon="group" label={t('navigation.userManagement')} onClick={() => handleNavClick('user-management')} />
          <NavItem icon="manage_accounts" label={t('navigation.marketers')} onClick={() => handleNavClick('marketers')} />
          <NavItem icon="handshake" label={t('navigation.partners')} onClick={() => handleNavClick('partners')} />
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
            <h1>{t('drivers.driverManagement')}</h1>
            <p className="sub">{t('drivers.searchDrivers')}</p>
            </div>
          </div>
          <div className="acts">
            <LanguageToggle />
            <ThemeToggle />
            <NotificationBell />
<div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="driver-management-card">
            <div className="card-header">
              <div className="header-left">
                <div className="filters-row">
                  <div className="search-filter">
                    <span className={`material-symbols-outlined${isLoading ? ' search-icon-loading' : ''}`}>
                      {isLoading ? 'hourglass_empty' : 'search'}
                    </span>
                    <input
                      placeholder={t('drivers.searchDrivers')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All Statuses">{t('drivers.allStatuses')}</option>
                    <option value="Online">{t('common.online')}</option>
                    <option value="Offline">{t('common.offline')}</option>
                    <option value="Suspended">{t('common.suspended')}</option>
                  </select>
                  <select 
                    className="filter-select"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="Any Rating">{t('drivers.anyRating')}</option>
                    <option value="4.5+">4.5+</option>
                    <option value="4.0+">4.0+</option>
                    <option value="3.5+">3.5+</option>
                  </select>
                  <input
                    type="date"
                    className="filter-date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label={t('analytics.startDate')}
                  />
                  <input
                    type="date"
                    className="filter-date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    aria-label={t('analytics.endDate')}
                  />
                  <button className="clear-filters" onClick={handleClearFilters}>
                    {t('drivers.clearFilters')}
                  </button>
                </div>
              </div>
              <div className="header-actions">
                <button 
                  className="btn-export" 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <span className="material-symbols-outlined">
                    {isExporting ? 'hourglass_empty' : 'picture_as_pdf'}
                  </span>
                  {isExporting ? t('drivers.exporting') : t('drivers.exportPDF')}
                </button>
              </div>
            </div>

            <div className={`table-container${isSearching ? ' is-searching' : ''}`}>
              {isSearching && (
                <div className="table-search-overlay" role="status" aria-live="polite">
                  <LazyLoader
                    variant="content"
                    lines={0}
                    message={t('drivers.loadingDrivers')}
                    className="table-search-loader"
                  />
                </div>
              )}
              {isInitialLoading ? (
                <LazyLoader variant="table" rows={8} columns={6} message={t('drivers.loadingDrivers')} />
              ) : (
              <table className="drivers-table">
                <thead>
                  <tr>
                    <th>{t('drivers.driverName')}</th>
                    <th>{t('drivers.vehicle')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('drivers.rating')}</th>
                    <th>{t('drivers.totalRides')}</th>
                    <th>{t('drivers.walletTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {error && drivers.length === 0 && !isSearching ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
                          <div style={{ color: '#ef4444', fontWeight: '500' }}>{t('common.error')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>{error}</div>
                          <button 
                            onClick={() => loadDrivers(searchTerm, statusFilter, ratingFilter, currentPage, startDate, endDate)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            {t('common.tryAgain')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDrivers.length === 0 && !isSearching ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6b7280' }}>search_off</span>
                          <div style={{ color: '#374151', fontWeight: '500' }}>{t('drivers.noDriversFound')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>
                            {searchTerm || statusFilter !== 'All Statuses' || ratingFilter !== 'Any Rating' || startDate || endDate
                              ? t('drivers.tryAdjustingFilters') 
                              : t('drivers.noDriversRegistered')
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="driver-row" onClick={() => handleDriverClick(driver.id)} style={{ cursor: 'pointer' }}>
                      <td className="driver-cell">
                        <div className="driver-info-cell">
                          <UserAvatar
                            src={driver.avatar}
                            name={driver.name}
                            className="driver-avatar"
                          />
                          <div>
                            <div className="driver-name-text">{driver.name}</div>
                            <div className="driver-phone">{driver.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="vehicle-cell">
                        <div className="vehicle-model">{driver.vehicle.model}</div>
                        <div className="vehicle-year">{driver.vehicle.year}</div>
                      </td>
                      <td><StatusBadge status={driver.status} /></td>
                      <td className="rating-cell">
                        <span className="star-icon">★</span> {driver.rating.toFixed(1)}
                      </td>
                      <td className="rides-cell">{formatNumber(driver.totalRides)}</td>
                      <td className="earnings-cell">
                        {formatCurrency(
                          driverWallets[driver.id]?.totalBalance ??
                          driverWallets[String(driver.id)]?.totalBalance ??
                          driver.earnings,
                        )}
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && !isInitialLoading && !error && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {t('drivers.showing')} {filteredDrivers.length} {t('drivers.of')} {totalCount} {t('drivers.drivers')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                      color: currentPage === 1 ? '#9ca3af' : '#374151',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {t('common.previous')}
                  </button>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            padding: '6px 12px',
                            border: '1px solid #d1d5db',
                            backgroundColor: currentPage === pageNum ? '#3b82f6' : 'white',
                            color: currentPage === pageNum ? 'white' : '#374151',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                      color: currentPage === totalPages ? '#9ca3af' : '#374151',
                      borderRadius: '6px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

