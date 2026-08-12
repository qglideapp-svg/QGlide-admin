import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagementView.css';
import { logoutUser } from '../../services/authService';
import { fetchUsersList, transformUserData, exportUsersToPDF, createUser } from '../../services/userService';
import UserAvatar from '../../components/common/UserAvatar';
import AddUserModal from '../../components/modals/AddUserModal';
import Toast from '../../components/common/Toast';
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
    if (!status) return 'status-inactive';
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return 'status-inactive';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{translateApiLabel(status || 'pending')}</span>;
};

export default function UserManagementView() {
  const navigate = useNavigate();
  const { t, formatNumber, formatDateTime, formatApiDateTime, translateApiLabel, formatCurrency } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // API-related state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const loadRequestIdRef = useRef(0);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fetch users from API with filters
  const loadUsers = useCallback(async (search = '', status = '', page = 1, start = '', end = '') => {
    const requestId = ++loadRequestIdRef.current;

    console.log('🔄 LOADING USERS:', {
      '🔍 Search Term': search,
      '📊 Status Filter': status,
      '📅 Start Date': start,
      '📅 End Date': end,
      '📄 Page': page,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchUsersList(search, status, '', page, limit, start, end);

      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      console.log('📡 API RESULT RECEIVED:', {
        '✅ Success': result.success,
        '📊 Has Data': !!result.data,
        '📝 Error': result.error,
        '🔍 Full Result': result,
        '🔍 Result.data.users': result.data?.users,
        '🔍 Result.data.users length': result.data?.users?.length,
        '🔍 Is result.data.users array?': Array.isArray(result.data?.users)
      });

      if (result.success && result.data) {
        const usersArray = Array.isArray(result.data.users) ? result.data.users : [];
        
        const transformedUsers = usersArray.map(transformUserData);
        
        setUsers(transformedUsers);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        
        console.log('✅ USERS LOADED SUCCESSFULLY:', {
          '📊 Transformed Count': transformedUsers.length,
          '📝 Total Count': result.data.totalCount,
          '📄 Current Page': result.data.currentPage,
          '📋 Total Pages': result.data.totalPages,
          '🔍 Raw Users Array': usersArray,
          '📋 Full Result Data': result.data,
          '⚙️ Transformed Users': transformedUsers,
          '🎯 First Transformed User': transformedUsers[0] || 'No users'
        });
      } else {
        setError(result.error || 'Failed to load users');
        console.error('❌ Failed to load users:', result.error);
      }
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      setError(error.message || 'An unexpected error occurred');
      console.error('❌ Load users error:', error);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
        setIsSearchPending(false);
      }
    }
  }, [limit]);

  // Debounced search and filter effect
  useEffect(() => {
    setIsSearchPending(true);

    const timer = setTimeout(() => {
      console.log('🔍 SEARCH/FILTER TRIGGERED:', {
        '📝 Search Term': searchTerm,
        '📊 Status Filter': statusFilter,
        '📅 Start Date': startDate,
        '📅 End Date': endDate,
        '⏰ Timestamp': new Date().toISOString()
      });
      loadUsers(searchTerm, statusFilter, 1, startDate, endDate);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, startDate, endDate, loadUsers]);

  // Fallback: Initialize with empty array if no users loaded after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (users.length === 0 && !isLoading && !error) {
        console.log('⚠️ No users loaded, initializing with empty array');
        setUsers([]);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [users.length, isLoading, error]);

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
    } else if (navItem === 'marketers') {
      navigate('/marketers');
    } else if (navItem === 'influencers') {
      navigate('/influencers');
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


  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, newPage, startDate, endDate);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, newPage, startDate, endDate);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, newPage, startDate, endDate);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user-profile/${userId}`);
  };

  // Handle add user click - opens modal
  const handleAddUserClick = () => {
    setShowAddUserModal(true);
  };

  // Handle create user confirmation - calls API
  const handleCreateUser = async (userData) => {
    console.log('🔄 CREATING USER:', {
      '📝 User Data': userData,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsCreating(true);

    try {
      const result = await createUser(userData);

      console.log('📡 CREATE USER RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: 'User created successfully!'
        });
        
        // Close modal and reload users list
        setShowAddUserModal(false);
        setTimeout(() => {
          loadUsers(searchTerm, statusFilter, currentPage, startDate, endDate);
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to create user'
        });
      }
    } catch (error) {
      console.error('❌ Create user error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);

    try {
      const result = await exportUsersToPDF(statusFilter, startDate, endDate);

      if (result.success) {
        setToast({
          type: 'success',
          message: `Users exported successfully! File: ${result.filename}`,
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to export users to PDF',
        });
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  const filteredUsers = users;
  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'All' ||
    startDate ||
    endDate
  );
  const isInitialLoading = isLoading && users.length === 0 && !error && !hasActiveFilters && !isSearchPending;
  const isSearching = isSearchPending || (isLoading && !isInitialLoading);

  return (
    <div className={`user-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label={t('navigation.userManagement')} active={true} />
          <NavItem icon="manage_accounts" label={t('navigation.marketers')} onClick={() => handleNavClick('marketers')} />
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
            <h1>{t('users.userManagement')}</h1>
            <p className="sub">{t('users.manageUsers')}</p>
            </div>
          </div>
          <div className="acts">
            <LanguageToggle />
            <ThemeToggle />
            <button className="ibtn" aria-label={t('common.settings')} onClick={() => navigate('/settings')}><img src={settingsIcon} alt="settings" className="kimg" /></button>
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
          <div className="user-management-card">
            <div className="card-header">
              <div className="header-left">
                <h2>{t('users.allUsers')}</h2>
                <p className="user-count">{t('users.totalOf')} {formatNumber(totalCount)} {t('users.users')}</p>
              </div>
              <div className="header-actions">
                <button 
                  className={`btn-export ${isExporting ? 'disabled' : ''}`} 
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <span className="material-symbols-outlined">
                    {isExporting ? 'hourglass_empty' : 'upload'}
                  </span>
                  {isExporting ? t('users.exporting') : t('users.exportPDF')}
                </button>
                <button className="btn-add-user" onClick={handleAddUserClick}>
                  <span className="material-symbols-outlined">add</span>
                  {t('users.addUser')}
                </button>
              </div>
            </div>

            <div className="filters-row">
              <div className="search-filter">
                <span className={`material-symbols-outlined${isSearching ? ' search-icon-loading' : ''}`}>
                  {isSearching ? 'hourglass_empty' : 'search'}
                </span>
                <input 
                  type="text" 
                  placeholder={t('users.searchUsers')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">{t('common.status')}: {t('common.all')}</option>
                <option value="Active">{t('common.status')}: {t('common.active')}</option>
                <option value="Inactive">{t('common.status')}: {t('common.inactive')}</option>
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
                {t('users.clearFilters')}
              </button>
            </div>

            <div className={`table-container${isSearching ? ' is-searching' : ''}`}>
              {isSearching && (
                <div className="table-search-overlay" role="status" aria-live="polite">
                  <LazyLoader
                    variant="content"
                    lines={0}
                    message={t('users.loadingUsers')}
                    className="table-search-loader"
                  />
                </div>
              )}
              {isInitialLoading ? (
                <LazyLoader variant="table" rows={8} columns={5} message={t('users.loadingUsers')} />
              ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('users.user')}</th>
                    <th>{t('users.contact')}</th>
                    <th>{t('users.totalRides')}</th>
                    <th>{t('users.lastRide')}</th>
                    <th>{t('users.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {error && !isSearching ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
                          <div style={{ color: '#ef4444', fontWeight: '500' }}>{t('common.error')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>{error}</div>
                          <button 
                            onClick={() => loadUsers(searchTerm, statusFilter, currentPage, startDate, endDate)}
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
                  ) : filteredUsers.length === 0 && !isSearching ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6b7280' }}>search_off</span>
                          <div style={{ color: '#374151', fontWeight: '500' }}>{t('users.noUsersFound')}</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>
                            {searchTerm || statusFilter !== 'All' || startDate || endDate
                              ? t('users.tryAdjustingFilters') 
                              : t('users.noUsersRegistered')
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="user-row" onClick={() => handleUserClick(user.id)} style={{ cursor: 'pointer' }}>
                      <td className="user-cell">
                        <div className="user-info-cell">
                          <UserAvatar
                            src={user.avatar}
                            name={user.name}
                            className="user-avatar"
                          />
                          <div>
                            <div className="user-name-text">{user.name}</div>
                            <div className="user-joined">Joined {getTimeAgo(user.joinedDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="contact-cell">{user.contact || 'N/A'}</td>
                      <td className="rides-cell">{user.totalRides || 0}</td>
                      <td className="date-cell">{user.lastRide || 'N/A'}</td>
                      <td><StatusBadge status={user.status} /></td>
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
                  {t('users.showing')} {filteredUsers.length} {t('users.of')} {totalCount} {t('users.users')}
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
      
      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onConfirm={handleCreateUser}
        isLoading={isCreating}
      />

      {/* Toast Notification */}
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

