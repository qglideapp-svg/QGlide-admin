import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UserProfileView.css';
import { logoutUser } from '../services/authService';
import { fetchUserDetails, updateUserStatus, updateUser, deleteUser } from '../services/userService';
import DeactivateUserModal from '../components/DeactivateUserModal';
import EditUserModal from '../components/EditUserModal';
import DeleteUserModal from '../components/DeleteUserModal';
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
    if (!status) return 'user-profile-status-inactive';
    switch (status.toLowerCase()) {
      case 'active': return 'user-profile-status-active';
      case 'inactive': return 'user-profile-status-inactive';
      default: return 'user-profile-status-inactive';
    }
  };

  return <span className={`user-profile-status-badge ${getStatusClass(status)}`}>{status}</span>;
};

const RideStatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return 'ride-status-completed';
    switch (status.toLowerCase()) {
      case 'completed': return 'ride-status-completed';
      case 'canceled': return 'ride-status-canceled';
      case 'cancelled': return 'ride-status-canceled';
      default: return 'ride-status-completed';
    }
  };

  return <span className={`ride-status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function UserProfileView() {
  const navigate = useNavigate();
  const { userId } = useParams();

  // API-related state
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Deactivate modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState(null);

  // Load user data from API
  const loadUserData = useCallback(async () => {
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    console.log('🔄 LOADING USER DETAILS:', {
      '🆔 User ID': userId,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchUserDetails(userId);

      console.log('📡 USER DETAILS API RESULT:', {
        '✅ Success': result.success,
        '📊 Has Data': !!result.data,
        '📝 Error': result.error,
        '🔍 Full Result': result
      });

      if (result.success && result.data) {
        const apiUser = result.data;
        
        // Transform API data to match existing UI structure
        const transformedData = {
          id: apiUser.id || userId,
          name: apiUser.full_name || 'Unknown User',
          avatar: apiUser.avatar_url || `https://i.pravatar.cc/120?img=${userId}`,
          status: apiUser.status || 'Active',
          email: apiUser.email || 'No email provided',
          phone: apiUser.phone || 'No phone provided',
          joinedDate: apiUser.created_at ? new Date(apiUser.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }) : 'Unknown',
          walletBalance: parseFloat(apiUser.earnings?.total || 0),
          lastTopUp: 'N/A', // Not in API response
          totalRides: parseInt(apiUser.total_rides || 0),
          rideHistory: (apiUser.recent_rides || []).map((ride, index) => ({
            id: ride.id || `RD-${index + 1}`,
            date: ride.created_at ? new Date(ride.created_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A',
            route: { 
              from: 'Pickup Location', // Not in API response
              to: 'Dropoff Location' // Not in API response
            },
            driver: 'Driver Name', // Not in API response
            fare: parseFloat(ride.fare || ride.actual_fare || 0),
            status: ride.status === 'completed' ? 'Completed' : 
                   ride.status === 'cancelled' ? 'Canceled' : 
                   ride.status === 'in_progress' ? 'In Progress' : 'Pending'
          }))
        };

        setUserData(transformedData);
        
        console.log('✅ USER DATA TRANSFORMED SUCCESSFULLY:', {
          '📊 Transformed Data': transformedData,
          '👤 User Name': transformedData.name,
          '📱 Phone': transformedData.phone,
          '💰 Wallet Balance': transformedData.walletBalance,
          '🚕 Total Rides': transformedData.totalRides
        });
      } else {
        setError(result.error || 'Failed to load user details');
        console.error('❌ Failed to load user details:', result.error);
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
      console.error('❌ Load user details error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle deactivate user click - opens modal
  const handleDeactivateClick = () => {
    setShowDeactivateModal(true);
  };

  // Handle edit user click - opens modal
  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // Handle delete user click - opens modal
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  // Handle deactivate user confirmation - calls API
  const handleDeactivateConfirm = async (status, reason) => {
    if (!userId) {
      setToast({
        type: 'error',
        message: 'No user ID available'
      });
      return;
    }

    console.log('🔄 DEACTIVATING USER:', {
      '🆔 User ID': userId,
      '📊 Status': status,
      '📝 Reason': reason,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsDeactivating(true);

    try {
      const result = await updateUserStatus(userId, status, reason);

      console.log('📡 DEACTIVATE RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: `User account ${status} successfully!`
        });
        
        // Close modal and reload user data
        setShowDeactivateModal(false);
        setTimeout(() => {
          loadUserData(); // Reload to get updated status
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to deactivate user account'
        });
      }
    } catch (error) {
      console.error('❌ Deactivate user error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  // Handle edit user confirmation - calls API
  const handleEditConfirm = async (userData) => {
    if (!userId) {
      setToast({
        type: 'error',
        message: 'No user ID available'
      });
      return;
    }

    console.log('🔄 EDITING USER:', {
      '🆔 User ID': userId,
      '📝 User Data': userData,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsUpdating(true);

    try {
      const result = await updateUser(userId, userData);

      console.log('📡 EDIT USER RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: 'User profile updated successfully!'
        });
        
        // Close modal and reload user data
        setShowEditModal(false);
        setTimeout(() => {
          loadUserData(); // Reload to get updated data
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to update user profile'
        });
      }
    } catch (error) {
      console.error('❌ Edit user error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete user confirmation - calls API
  const handleDeleteConfirm = async (reason) => {
    if (!userId) {
      setToast({
        type: 'error',
        message: 'No user ID available'
      });
      return;
    }

    console.log('🔄 DELETING USER:', {
      '🆔 User ID': userId,
      '📝 Reason': reason,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsDeleting(true);

    try {
      const result = await deleteUser(userId, reason);

      console.log('📡 DELETE USER RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: 'User account deleted successfully!'
        });
        
        // Close modal and redirect to user management
        setShowDeleteModal(false);
        setTimeout(() => {
          navigate('/user-management');
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to delete user account'
        });
      }
    } catch (error) {
      console.error('❌ Delete user error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
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

  const handleBackToUsers = () => {
    navigate('/user-management');
  };

  return (
    <div className="user-profile grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" active={true} onClick={() => handleNavClick('user-management')} />
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

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>User Profile</h1>
            <div className="breadcrumbs">
              <span className="breadcrumb-link" onClick={handleBackToUsers}>User Management</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-current">Profile Details</span>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
            <button className="ibtn" aria-label="dark mode">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
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
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading user details...</div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <div className="error-title">Error Loading User</div>
              <div className="error-message">{error}</div>
              <button className="retry-btn" onClick={loadUserData}>
                Try Again
              </button>
            </div>
          ) : !userData ? (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <div className="error-title">User Not Found</div>
              <div className="error-message">The requested user could not be found.</div>
              <button className="retry-btn" onClick={() => navigate('/user-management')}>
                Back to Users
              </button>
            </div>
          ) : (
          <div className="user-profile-content">
            {/* Left Column - User Information */}
            <div className="user-info-column">
              <div className="user-info-card">
                {/* Profile Header */}
                <div className="profile-header">
                  <div className="avatar-wrapper">
                    <img src={userData.avatar} alt={userData.name} className="user-avatar-large" />
                  </div>
                  <h2 className="user-name-large">{userData.name}</h2>
                  <div className="user-id">User ID: #{userData.id}</div>
                  <StatusBadge status={userData.status} />
                </div>

                {/* Contact Information */}
                <div className="info-section">
                  <h3 className="section-title">Contact Information</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="material-symbols-outlined info-icon">mail</span>
                      <span className="info-text">{userData.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="material-symbols-outlined info-icon">phone</span>
                      <span className="info-text">{userData.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="material-symbols-outlined info-icon">calendar_today</span>
                      <span className="info-text">Joined: {userData.joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="actions-section">
                  <h3 className="section-title">Account Actions</h3>
                  <div className="action-buttons">
                    <button className="btn-edit-profile" onClick={handleEditClick}>
                      <span className="material-symbols-outlined">edit</span>
                      Edit Profile
                    </button>
                    <button className="btn-deactivate" onClick={handleDeactivateClick}>
                      <span className="material-symbols-outlined">block</span>
                      Change Status
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Wallet & Ride History */}
            <div className="details-column">
              {/* Wallet Balance Card */}
              <div className="wallet-card">
                <div className="wallet-header">
                  <div>
                    <h3 className="wallet-title">Wallet Balance</h3>
                    <div className="wallet-balance">QAR {userData.walletBalance.toFixed(2)}</div>
                    <div className="wallet-subtitle">Last top-up: {userData.lastTopUp}</div>
                  </div>
                  <div className="wallet-actions">
                    <button className="btn-view-history" onClick={handleDeleteClick}>Delete Account</button>
                    <button className="btn-add-funds">Export to CSV</button>
                  </div>
                </div>
              </div>

              {/* Ride History Card */}
              <div className="ride-history-card">
                <div className="ride-history-header">
                  <h3 className="ride-history-title">Ride History</h3>
                  <div className="total-rides">Total Rides: {userData.totalRides}</div>
                </div>
                <div className="ride-history-table-container">
                  <table className="ride-history-table">
                    <thead>
                      <tr>
                        <th>RIDE ID</th>
                        <th>DATE</th>
                        <th>ROUTE</th>
                        <th>DRIVER</th>
                        <th>FARE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.rideHistory.map((ride) => (
                        <tr key={ride.id}>
                          <td className="ride-id">#{ride.id}</td>
                          <td className="ride-date">{ride.date}</td>
                          <td className="ride-route">
                            <span>{ride.route.from}</span>
                            <span className="material-symbols-outlined route-arrow">arrow_forward</span>
                            <span>{ride.route.to}</span>
                          </td>
                          <td className="ride-driver">{ride.driver}</td>
                          <td className="ride-fare">QAR {ride.fare.toFixed(2)}</td>
                          <td><RideStatusBadge status={ride.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>
      
      {/* Deactivate User Modal */}
      <DeactivateUserModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivateConfirm}
        userName={userData?.name || 'Unknown User'}
        isLoading={isDeactivating}
      />
      
      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleEditConfirm}
        userData={userData}
        isLoading={isUpdating}
      />
      
      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        userName={userData?.name || 'Unknown User'}
        isLoading={isDeleting}
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

