import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './DriverManagementView.css';
import { logoutUser } from '../../services/authService';
import { fetchDriversList, transformDriverData, exportDriversToCSV } from '../../services/driverService';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import notificationsIcon from '../../assets/icons/notifications.png';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return 'driver-status-offline';
    switch (status.toLowerCase()) {
      case 'active': return 'driver-status-active';
      case 'offline': return 'driver-status-offline';
      case 'suspended': return 'driver-status-suspended';
      default: return 'driver-status-offline';
    }
  };

  return <span className={`driver-status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function DriverManagementView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // API-related state
  const [drivers, setDrivers] = useState([]);
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
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fetch drivers from API
  const loadDrivers = useCallback(async (search = '', status = '') => {
    console.log('🔄 LOADING DRIVERS:', {
      '🔍 Search Term': search,
      '📊 Status Filter': status,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDriversList(search, status);

      console.log('📡 API RESULT RECEIVED:', {
        '✅ Success': result.success,
        '📊 Has Data': !!result.data,
        '📝 Error': result.error,
        '🔍 Full Result': result,
        '🔍 Result.data.drivers': result.data?.drivers,
        '🔍 Result.data.drivers length': result.data?.drivers?.length,
        '🔍 Is result.data.drivers array?': Array.isArray(result.data?.drivers)
      });

      if (result.success && result.data) {
        // Ensure drivers is an array before mapping
        const driversArray = Array.isArray(result.data.drivers) ? result.data.drivers : [];
        
        // Transform API data to UI format
        const transformedDrivers = driversArray.map(transformDriverData);
        
        setDrivers(transformedDrivers);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        
        console.log('✅ DRIVERS LOADED SUCCESSFULLY:', {
          '📊 Transformed Count': transformedDrivers.length,
          '📝 Total Count': result.data.totalCount,
          '📄 Current Page': result.data.currentPage,
          '📋 Total Pages': result.data.totalPages,
          '🔍 Raw Drivers Array': driversArray,
          '📋 Full Result Data': result.data,
          '⚙️ Transformed Drivers': transformedDrivers,
          '🎯 First Transformed Driver': transformedDrivers[0] || 'No drivers'
        });
      } else {
        setError(result.error || 'Failed to load drivers');
        console.error('❌ Failed to load drivers:', result.error);
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
      console.error('❌ Load drivers error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load drivers on mount
  useEffect(() => {
    loadDrivers();
  }, []);

  // Debounced search and filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 SEARCH/FILTER TRIGGERED:', {
        '📝 Search Term': searchTerm,
        '📊 Status Filter': statusFilter,
        '⏰ Timestamp': new Date().toISOString()
      });
      loadDrivers(searchTerm, statusFilter);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDrivers(filteredDrivers.map(driver => driver.id));
    } else {
      setSelectedDrivers([]);
    }
  };

  const handleSelectDriver = (driverId) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      } else {
        return [...prev, driverId];
      }
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All Statuses');
    setRatingFilter('Any Rating');
    setCurrentPage(1);
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    console.log('🔄 EXPORTING DRIVERS TO CSV:', {
      '📊 Status Filter': statusFilter,
      '⭐ Rating Filter': ratingFilter,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsExporting(true);

    try {
      const result = await exportDriversToCSV(statusFilter, ratingFilter);

      console.log('📡 EXPORT RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📄 Filename': result.filename,
        '📏 Size': result.size
      });

      if (result.success) {
        // Show success message (you could add a toast notification here)
        console.log('✅ CSV export completed successfully!');
        // Optionally show a toast notification
        // setToast({ type: 'success', message: `Export completed: ${result.filename}` });
      } else {
        console.error('❌ Export failed:', result.error);
        // Optionally show error toast
        // setToast({ type: 'error', message: result.error });
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      // Optionally show error toast
      // setToast({ type: 'error', message: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDriverClick = (driverId) => {
    navigate(`/driver-profile/${driverId}`);
  };

  // Apply client-side rating filter (since API doesn't support rating filtering)
  const filteredDrivers = drivers.filter(driver => {
    const matchesRating = ratingFilter === 'Any Rating' || 
                         (ratingFilter === '4.5+' && driver.rating >= 4.5) ||
                         (ratingFilter === '4.0+' && driver.rating >= 4.0) ||
                         (ratingFilter === '3.5+' && driver.rating >= 3.5);
    
    return matchesRating;
  });

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
            <div className="search">
              <span className="material-symbols-outlined">
                {isLoading ? 'hourglass_empty' : 'search'}
              </span>
              <input 
                placeholder={t('drivers.searchDrivers')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <ThemeToggle />
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
          <div className="driver-management-card">
            <div className="card-header">
              <div className="header-left">
                <div className="filters-row">
                  <select 
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All Statuses">{t('drivers.allStatuses')}</option>
                    <option value="Active">{t('common.active')}</option>
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
                  <button className="clear-filters" onClick={handleClearFilters}>
                    {t('drivers.clearFilters')}
                  </button>
                </div>
              </div>
              <div className="header-actions">
                <button 
                  className="btn-export" 
                  onClick={handleExportCSV}
                  disabled={isExporting}
                >
                  <span className="material-symbols-outlined">
                    {isExporting ? 'hourglass_empty' : 'download'}
                  </span>
                  {isExporting ? t('drivers.exporting') : t('drivers.exportCSV')}
                </button>
                <button className="btn-add-driver">
                  <span className="material-symbols-outlined">add</span>
                  {t('drivers.addDriver')}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="drivers-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                      />
                    </th>
                    <th>{t('drivers.driverName')}</th>
                    <th>{t('drivers.vehicle')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('drivers.rating')}</th>
                    <th>{t('drivers.totalRides')}</th>
                    <th>{t('drivers.earnings')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <div className="loading-spinner" style={{ 
                            width: '24px', 
                            height: '24px', 
                            border: '2px solid #e5e7eb', 
                            borderTop: '2px solid #3b82f6', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                          <span style={{ color: '#6b7280' }}>{t('drivers.loadingDrivers')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
                          <div style={{ color: '#ef4444', fontWeight: '500' }}>{t('common.error')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>{error}</div>
                          <button 
                            onClick={loadDrivers}
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
                  ) : filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6b7280' }}>search_off</span>
                          <div style={{ color: '#374151', fontWeight: '500' }}>{t('drivers.noDriversFound')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>
                            {searchTerm || statusFilter !== 'All Statuses' || ratingFilter !== 'Any Rating' 
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
                      <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={selectedDrivers.includes(driver.id)}
                          onChange={() => handleSelectDriver(driver.id)}
                        />
                      </td>
                      <td className="driver-cell">
                        <div className="driver-info-cell">
                          <img src={driver.avatar} alt={driver.name} className="driver-avatar" />
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
                      <td className="rides-cell">{driver.totalRides.toLocaleString()}</td>
                      <td className="earnings-cell">{driver.earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button className="action-menu-btn" aria-label="Actions">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && !error && (
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

