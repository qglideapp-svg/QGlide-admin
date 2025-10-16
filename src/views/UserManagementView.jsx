import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagementView.css';
import { logoutUser } from '../services/authService';
import { fetchUsersList, transformUserData, exportUsersToCSV, createUser } from '../services/userService';
import AddUserModal from '../components/AddUserModal';
import Toast from '../components/Toast';
import logo from '../assets/images/logo.webp';
import settingsIcon from '../assets/icons/settings.png';
import notificationsIcon from '../assets/icons/notifications.png';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return 'status-inactive';
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return 'status-inactive';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function UserManagementView() {
  const navigate = useNavigate();
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
  const [ratingFilter, setRatingFilter] = useState('Any');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Fetch users from API with filters
  const loadUsers = useCallback(async (search = '', status = '', rating = '', page = 1) => {
    console.log('🔄 LOADING USERS:', {
      '🔍 Search Term': search,
      '📊 Status Filter': status,
      '⭐ Rating Filter': rating,
      '📄 Page': page,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchUsersList(search, status, rating, page, limit);

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
      setError(error.message || 'An unexpected error occurred');
      console.error('❌ Load users error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search and filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 SEARCH/FILTER TRIGGERED:', {
        '📝 Search Term': searchTerm,
        '📊 Status Filter': statusFilter,
        '⭐ Rating Filter': ratingFilter,
        '⏰ Timestamp': new Date().toISOString()
      });
      loadUsers(searchTerm, statusFilter, ratingFilter, 1);
      setCurrentPage(1); // Reset to first page when filters change
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, ratingFilter, loadUsers]);

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
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setRatingFilter('Any');
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, ratingFilter, newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, ratingFilter, newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadUsers(searchTerm, statusFilter, ratingFilter, newPage);
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
          loadUsers(searchTerm, statusFilter, ratingFilter, currentPage);
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

  // Handle export users to CSV
  const handleExportCSV = async () => {
    console.log('🔄 EXPORTING USERS TO CSV:', {
      '📊 Status Filter': statusFilter,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsExporting(true);

    try {
      const result = await exportUsersToCSV(statusFilter);

      console.log('📡 EXPORT RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📄 Filename': result.filename,
        '📏 Size': result.size
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: `Users exported successfully! File: ${result.filename}`
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to export users to CSV'
        });
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
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

  // Use API data directly (no client-side filtering needed)
  const filteredUsers = users;

  return (
    <div className={`user-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" active={true} />
          <NavItem icon="account_balance_wallet" label="Financial" onClick={() => handleNavClick('financial')} />
          <NavItem icon="support_agent" label="Support" onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label="Analytics" onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label="Reports" onClick={() => handleNavClick('reports')} />
        </nav>

        <div className="sfoot">
          <button className="settings" type="button" onClick={() => navigate('/settings')}>
            <img src={settingsIcon} alt="settings" className="kimg" />
            <span>Settings</span>
          </button>
          <div className="urow">
            <img src="https://i.pravatar.cc/80?img=5" alt="Amina" className="avatar" />
            <div className="meta">
              <div className="name">Amina Al-Thani</div>
              <div className="role">Super Admin</div>
            </div>
            <button className="logout-btn-sidebar" aria-label="logout" onClick={handleLogout}>
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
            <h1>User Management</h1>
            <p className="sub">View, manage, and interact with all registered users.</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <button className="ibtn" aria-label="settings" onClick={() => navigate('/settings')}><img src={settingsIcon} alt="settings" className="kimg" /></button>
            <button className="ibtn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">Amina Al-Thani</span>
              <button className="logout-btn" aria-label="logout" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="user-management-card">
            <div className="card-header">
              <div className="header-left">
                <h2>All Users</h2>
                <p className="user-count">Total of {totalCount.toLocaleString()} users</p>
              </div>
              <div className="header-actions">
                <button 
                  className={`btn-export ${isExporting ? 'disabled' : ''}`} 
                  onClick={handleExportCSV}
                  disabled={isExporting}
                >
                  <span className="material-symbols-outlined">
                    {isExporting ? 'hourglass_empty' : 'upload'}
                  </span>
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
                <button className="btn-add-user" onClick={handleAddUserClick}>
                  <span className="material-symbols-outlined">add</span>
                  Add User
                </button>
              </div>
            </div>

            <div className="filters-row">
              <div className="search-filter">
                <span className="material-symbols-outlined">
                  {isLoading ? 'hourglass_empty' : 'search'}
                </span>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Inactive">Status: Inactive</option>
                <option value="Suspended">Status: Suspended</option>
              </select>
              <select 
                className="filter-select"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="Any">Rating: Any</option>
                <option value="4.5+">Rating: 4.5+</option>
                <option value="4.0+">Rating: 4.0+</option>
              </select>
              <button className="clear-filters" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>

            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th>USER</th>
                    <th>CONTACT</th>
                    <th>TOTAL RIDES</th>
                    <th>LAST RIDE</th>
                    <th>RATING</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
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
                          <span style={{ color: '#6b7280' }}>Loading users...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ef4444' }}>error</span>
                          <div style={{ color: '#ef4444', fontWeight: '500' }}>Error loading users</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>{error}</div>
                          <button 
                            onClick={loadUsers}
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
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#6b7280' }}>search_off</span>
                          <div style={{ color: '#374151', fontWeight: '500' }}>No users found</div>
                          <div style={{ color: '#6b7280', fontSize: '14px' }}>
                            {searchTerm || statusFilter !== 'All' || ratingFilter !== 'Any' 
                              ? 'Try adjusting your search term or filter criteria' 
                              : 'No users are currently registered on the platform'
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="user-row" onClick={() => handleUserClick(user.id)} style={{ cursor: 'pointer' }}>
                      <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="user-cell">
                        <div className="user-info-cell">
                          <img src={user.avatar} alt={user.name} className="user-avatar" />
                          <div>
                            <div className="user-name-text">{user.name}</div>
                            <div className="user-joined">Joined {getTimeAgo(user.joinedDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="contact-cell">{user.contact}</td>
                      <td className="rides-cell">{user.totalRides}</td>
                      <td className="date-cell">{user.lastRide}</td>
                      <td className="rating-cell">
                        <span className="star-icon">★</span> {user.rating.toFixed(1)}
                      </td>
                      <td><StatusBadge status={user.status} /></td>
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
                  Showing {filteredUsers.length} of {totalCount} users
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
                    Previous
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
                    Next
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

