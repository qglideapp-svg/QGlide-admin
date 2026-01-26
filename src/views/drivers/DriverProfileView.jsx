import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DriverProfileView.css';
import { logoutUser } from '../../services/authService';
import { fetchDriverDetails, approveDriver, suspendDriver, unsuspendDriver, updateDriver } from '../../services/driverService';
import Toast from '../../components/common/Toast';
import SuspendDriverModal from '../../components/modals/SuspendDriverModal';
import UnsuspendDriverModal from '../../components/modals/UnsuspendDriverModal';
import EditDriverModal from '../../components/modals/EditDriverModal';
import DocumentViewModal from '../../components/modals/DocumentViewModal';
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
    if (!status) return 'driver-profile-status-offline';
    switch (status.toLowerCase()) {
      case 'active': return 'driver-profile-status-active';
      case 'offline': return 'driver-profile-status-offline';
      case 'suspended': return 'driver-profile-status-suspended';
      default: return 'driver-profile-status-offline';
    }
  };

  return <span className={`driver-profile-status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function DriverProfileView() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal');

  // API state
  const [driverData, setDriverData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  // Approve button loading state
  const [isApproving, setIsApproving] = useState(false);
  
  // Suspend modal and loading states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  
  // Unsuspend modal and loading states
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [isUnsuspending, setIsUnsuspending] = useState(false);
  
  // Edit modal and loading states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Load driver data from API
  useEffect(() => {
    const loadDriverData = async () => {
      if (!driverId) {
        setError('No driver ID provided');
        setIsLoading(false);
        return;
      }

      console.log('🔄 LOADING DRIVER DETAILS:', {
        '🆔 Driver ID': driverId,
        '⏰ Timestamp': new Date().toISOString()
      });

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchDriverDetails(driverId);

        console.log('📡 DRIVER DETAILS API RESULT:', {
          '✅ Success': result.success,
          '📊 Has Data': !!result.data,
          '📝 Error': result.error,
          '🔍 Full Result': result
        });

        if (result.success && result.data) {
          const apiDriver = result.data;
          
          // Log document data structure for debugging
          console.log('📄 DOCUMENTS DATA:', {
            'Raw Documents': apiDriver.documents,
            'Driver Profile Documents': apiDriver.driver_profile?.documents,
            'Uploaded Documents': apiDriver.uploaded_documents,
            'All API Keys': Object.keys(apiDriver),
            'Driver Profile Keys': apiDriver.driver_profile ? Object.keys(apiDriver.driver_profile) : 'No driver_profile'
          });
          
          // Log status fields for debugging
          console.log('🔍 DRIVER STATUS FIELDS:', {
            'apiDriver.status': apiDriver.status,
            'apiDriver.driver_profile?.status': apiDriver.driver_profile?.status,
            'apiDriver.is_suspended': apiDriver.is_suspended,
            'apiDriver.driver_profile?.is_suspended': apiDriver.driver_profile?.is_suspended,
            'apiDriver.driver_profile?.is_online': apiDriver.driver_profile?.is_online,
            'All API Keys': Object.keys(apiDriver)
          });
          
          // Transform API data to match existing UI structure
          // Determine status: check for suspended first, then online/offline
          let driverStatus = 'Offline';
          if (apiDriver.status?.toLowerCase() === 'suspended' || 
              apiDriver.driver_profile?.status?.toLowerCase() === 'suspended' ||
              apiDriver.is_suspended === true ||
              apiDriver.driver_profile?.is_suspended === true) {
            driverStatus = 'Suspended';
          } else if (apiDriver.driver_profile?.is_online) {
            driverStatus = 'Active';
          }
          
          console.log('✅ DETERMINED DRIVER STATUS:', driverStatus);
          
          const transformedData = {
            id: apiDriver.id || driverId,
            name: apiDriver.full_name || 'Unknown Driver',
            avatar: apiDriver.avatar_url || `https://i.pravatar.cc/120?img=${driverId}`,
            status: driverStatus,
            rating: parseFloat(apiDriver.rating || 0),
            totalReviews: Math.floor(Math.random() * 1000) + 100, // Mock reviews count
            acceptanceRate: Math.floor(Math.random() * 20) + 80, // Mock acceptance rate
            totalRides: parseInt(apiDriver.total_rides || 0),
            ridesThisMonth: Math.floor(Math.random() * 100) + 20, // Mock monthly rides
            totalEarnings: parseFloat(apiDriver.earnings?.total || 0),
            earningsThisMonth: parseFloat(apiDriver.earnings?.this_month || 0),
            cancellationRate: Math.floor(Math.random() * 5) + 1, // Mock cancellation rate
    personalDetails: {
              fullName: apiDriver.full_name || 'Unknown Driver',
              email: apiDriver.email || 'No email provided',
              phone: apiDriver.phone || 'No phone provided',
              address: 'Address not available', // Not in API response
              dateJoined: apiDriver.created_at ? new Date(apiDriver.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'Unknown'
    },
    vehicleDetails: {
              model: apiDriver.driver_profile?.vehicle_model || 'Unknown Vehicle',
              year: apiDriver.driver_profile?.vehicle_year || new Date().getFullYear(),
              licensePlate: apiDriver.driver_profile?.vehicle_plate || 'Not provided',
              color: apiDriver.driver_profile?.vehicle_color || 'Unknown',
              vin: 'Not available' // Not in API response
    },
    documents: (() => {
              // Try to get documents from API first
              const apiDocuments = apiDriver.documents || apiDriver.driver_profile?.documents || apiDriver.uploaded_documents || [];
              
              if (apiDocuments && apiDocuments.length > 0) {
                // Use actual API document data
                return apiDocuments.map(doc => ({
                  name: doc.document_name || doc.name || doc.type || doc.title || 'Unknown Document',
                  status: doc.status || doc.verification_status || doc.approval_status || 'Pending',
                  uploadDate: doc.upload_date || doc.uploaded_at || doc.created_at || null,
                  url: doc.document_url || doc.url || doc.file_url || null
                }));
              } else {
                // Fallback to hardcoded data if API doesn't provide documents
                console.log('📄 Using fallback document data - API did not provide documents');
                return [
                  { 
                    name: 'Qatari ID', 
                    status: apiDriver.is_verified ? 'Verified' : 'Pending' 
                  },
                  { 
                    name: "Driver's License", 
                    status: apiDriver.driver_profile?.license_number ? 'Verified' : 'Pending' 
                  },
                  { 
                    name: 'Vehicle Registration', 
                    status: apiDriver.driver_profile?.vehicle_plate ? 'Verified' : 'Pending' 
                  },
                  { 
                    name: 'Background Check', 
                    status: apiDriver.driver_profile?.background_check_status === 'approved' ? 'Verified' : 'Pending' 
                  }
                ];
              }
            })(),
            recentRides: (apiDriver.recent_rides || []).map((ride, index) => ({
              id: ride.id || `R${index + 1}`,
              rider: `Rider ${index + 1}`, // Not in API response
              date: ride.completed_at ? new Date(ride.completed_at).toLocaleDateString('en-US') : 'N/A',
              fare: parseFloat(ride.fare || 0),
              status: ride.status === 'completed' ? 'Completed' : 
                     ride.status === 'cancelled' ? 'Cancelled' : 
                     ride.status === 'in_progress' ? 'In Progress' : 'Pending'
            }))
          };

          setDriverData(transformedData);
          
          console.log('✅ DRIVER DATA TRANSFORMED SUCCESSFULLY:', {
            '📊 Transformed Data': transformedData,
            '👤 Driver Name': transformedData.name,
            '📱 Phone': transformedData.personalDetails.phone,
            '🚗 Vehicle': transformedData.vehicleDetails.model,
            '💰 Total Earnings': transformedData.totalEarnings,
            '🚕 Total Rides': transformedData.totalRides
          });
        } else {
          setError(result.error || 'Failed to load driver details');
          console.error('❌ Failed to load driver details:', result.error);
        }
      } catch (error) {
        setError(error.message || 'An unexpected error occurred');
        console.error('❌ Load driver details error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriverData();
  }, [driverId]);

  // Handle approve driver
  const handleApprove = async () => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available'
      });
      return;
    }

    console.log('🔄 APPROVING DRIVER:', {
      '🆔 Driver ID': driverId,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsApproving(true);

    try {
      const result = await approveDriver(driverId);

      console.log('📡 APPROVE RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: t('toast.driverApproved')
        });
        
        // Reload driver data to reflect updated status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate')
        });
      }
    } catch (error) {
      console.error('❌ Approve driver error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Handle suspend driver click - opens modal
  const handleSuspendClick = () => {
    setShowSuspendModal(true);
  };

  // Handle suspend driver confirmation - calls API
  const handleSuspendConfirm = async (reason) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available'
      });
      return;
    }

    console.log('🔄 SUSPENDING DRIVER:', {
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsSuspending(true);

    try {
      const result = await suspendDriver(driverId, reason);

      console.log('📡 SUSPEND RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: t('toast.driverSuspended')
        });
        
        // Close modal and reload driver data
        setShowSuspendModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate')
        });
      }
    } catch (error) {
      console.error('❌ Suspend driver error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSuspending(false);
    }
  };

  // Handle edit driver click - opens modal
  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // Handle edit driver confirmation - calls API
  const handleEditConfirm = async (updateData) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available'
      });
      return;
    }

    console.log('🔄 UPDATING DRIVER:', {
      '🆔 Driver ID': driverId,
      '📝 Update Data': updateData,
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsUpdating(true);

    try {
      const result = await updateDriver(driverId, updateData);

      console.log('📡 UPDATE RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: t('toast.driverUpdated')
        });
        
        // Close modal and reload driver data
        setShowEditModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate')
        });
      }
    } catch (error) {
      console.error('❌ Update driver error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle unsuspend driver click - opens modal
  const handleUnsuspendClick = () => {
    setShowUnsuspendModal(true);
  };

  // Handle unsuspend driver confirmation - calls API
  const handleUnsuspendConfirm = async (reason) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available'
      });
      return;
    }

    console.log('🔄 UNSUSPENDING DRIVER:', {
      '🆔 Driver ID': driverId,
      '📝 Reason': reason || 'Suspension lifted after review',
      '⏰ Timestamp': new Date().toISOString()
    });

    setIsUnsuspending(true);

    try {
      const result = await unsuspendDriver(driverId, reason || '');

      console.log('📡 UNSUSPEND RESULT:', {
        '✅ Success': result.success,
        '📝 Error': result.error,
        '📊 Data': result.data
      });

      if (result.success) {
        setToast({
          type: 'success',
          message: t('toast.driverUnsuspended')
        });
        
        // Close modal and reload driver data
        setShowUnsuspendModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate')
        });
      }
    } catch (error) {
      console.error('❌ Unsuspend driver error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsUnsuspending(false);
    }
  };

  // Handle document view click - opens modal
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

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
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
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

  const handleBackToDrivers = () => {
    navigate('/driver-management');
  };

  return (
    <div className="driver-profile grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} active={true} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label={t('navigation.userManagement')} onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label={t('navigation.financial')} onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label={t('navigation.withdrawals')} onClick={() => handleNavClick('withdrawals')} />
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

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>{t('drivers.driverProfile')}</h1>
            <div className="breadcrumbs">
              <span className="breadcrumb-link" onClick={handleBackToDrivers}>{t('drivers.driverManagement')}</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-current">
                {isLoading ? t('common.loading') : driverData ? driverData.name : t('drivers.driverProfile')}
              </span>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder={t('common.search')} />
            </div>
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
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">{t('drivers.loadingDriverDetails')}</div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <div className="error-title">{t('drivers.errorLoadingDriver')}</div>
              <div className="error-message">{error}</div>
              <button className="retry-btn" onClick={() => window.location.reload()}>
                {t('common.tryAgain')}
              </button>
            </div>
          ) : !driverData ? (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <div className="error-title">{t('drivers.driverNotFound')}</div>
              <div className="error-message">{t('drivers.requestedDriverNotFound')}</div>
              <button className="retry-btn" onClick={() => navigate('/driver-management')}>
                {t('drivers.backToDrivers')}
              </button>
            </div>
          ) : (
            <>
          {/* Driver Header Card */}
          <div className="driver-header-card">
            <div className="driver-header-left">
              <img src={driverData.avatar} alt={driverData.name} className="driver-avatar-large" />
              <div className="driver-header-info">
                <div className="driver-name-row">
                  <h2 className="driver-name-large">{driverData.name}</h2>
                  <StatusBadge status={driverData.status} />
                </div>
                <div className="driver-rating">
                  <span className="star-icon-large">★</span>
                  <span className="rating-value">{driverData.rating.toFixed(2)}</span>
                  <span className="rating-reviews">({driverData.totalReviews.toLocaleString()} {t('drivers.reviews')})</span>
                </div>
              </div>
            </div>
            <div className="driver-header-actions">
              <button className="btn-edit-profile" onClick={handleEditClick}>
                <span className="material-symbols-outlined">edit</span>
                {t('drivers.editProfile')}
              </button>
              <button 
                className="btn-approve" 
                onClick={handleApprove}
                disabled={isApproving}
              >
                <span className="material-symbols-outlined">
                  {isApproving ? 'hourglass_empty' : 'check_circle'}
                </span>
                {isApproving ? t('drivers.approving') : t('drivers.approve')}
              </button>
              {driverData?.status?.toLowerCase() !== 'suspended' && (
                <button className="btn-suspend" onClick={handleSuspendClick}>
                  <span className="material-symbols-outlined">block</span>
                  {t('drivers.suspend')}
                </button>
              )}
              <button 
                className="btn-unsuspend" 
                onClick={handleUnsuspendClick}
                disabled={isUnsuspending}
                title={t('drivers.unsuspend')}
              >
                <span className="material-symbols-outlined">
                  {isUnsuspending ? 'hourglass_empty' : 'check_circle'}
                </span>
                {isUnsuspending ? t('drivers.unsuspending') : t('drivers.unsuspend')}
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.acceptanceRate')}</div>
              <div className="kpi-value">{driverData.acceptanceRate}%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.totalRides')}</div>
              <div className="kpi-value">{driverData.totalRides.toLocaleString()}</div>
              <div className="kpi-subtitle">{t('dashboard.ridesThisMonth')}: {driverData.ridesThisMonth}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.totalEarnings')}</div>
              <div className="kpi-value">QAR {driverData.totalEarnings.toLocaleString()}</div>
              <div className="kpi-subtitle earnings">QAR {driverData.earningsThisMonth.toLocaleString()} {t('drivers.earningsThisMonth')}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.cancellationRate')}</div>
              <div className="kpi-value cancellation">{driverData.cancellationRate}%</div>
              <div className="kpi-subtitle">{t('drivers.belowTarget')}</div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="content-grid">
            {/* Left Panel - Tabbed Section */}
            <div className="details-panel">
              <div className="tabs-header">
                <button 
                  className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                >
                  {t('drivers.personalDetails')}
                </button>
                <button 
                  className={`tab ${activeTab === 'vehicle' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vehicle')}
                >
                  {t('drivers.vehicleDetails')}
                </button>
                <button 
                  className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  {t('drivers.rideHistory')}
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'personal' && (
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.fullName')}</span>
                      <span className="detail-value">{driverData.personalDetails.fullName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.emailAddress')}</span>
                      <span className="detail-value">{driverData.personalDetails.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.phoneNumber')}</span>
                      <span className="detail-value">{driverData.personalDetails.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.address')}</span>
                      <span className="detail-value">{driverData.personalDetails.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.dateJoined')}</span>
                      <span className="detail-value">{driverData.personalDetails.dateJoined}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'vehicle' && (
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.vehicleModel')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.model}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.year')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.year}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.licensePlate')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.licensePlate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.color')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.color}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.vin')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.vin}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="ride-history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('drivers.rideId')}</th>
                          <th>{t('drivers.rider')}</th>
                          <th>{t('drivers.date')}</th>
                          <th>{t('drivers.fare')}</th>
                          <th>{t('common.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverData.recentRides.map(ride => (
                          <tr key={ride.id}>
                            <td>#{ride.id}</td>
                            <td>{ride.rider}</td>
                            <td>{ride.date}</td>
                            <td>QAR {ride.fare.toFixed(2)}</td>
                            <td><span className="status-completed">{ride.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Uploaded Documents */}
            <div className="documents-panel">
              <h3>{t('drivers.uploadedDocuments')}</h3>
              <div className="documents-list">
                {driverData.documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="document-info">
                      <div className="document-name">{doc.name}</div>
                      <div className={`document-status ${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </div>
                    </div>
                    <button 
                      className="btn-view-document" 
                      aria-label={t('modals.viewDocument')}
                      onClick={() => handleViewDocument(doc)}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
      
          {/* Edit Driver Modal */}
          <EditDriverModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onConfirm={handleEditConfirm}
            driverData={driverData}
            isLoading={isUpdating}
          />
          
          {/* Suspend Driver Modal */}
          <SuspendDriverModal
            isOpen={showSuspendModal}
            onClose={() => setShowSuspendModal(false)}
            onConfirm={handleSuspendConfirm}
            driverName={driverData?.name || 'Unknown Driver'}
            isLoading={isSuspending}
          />
          
          {/* Unsuspend Driver Modal */}
          <UnsuspendDriverModal
            isOpen={showUnsuspendModal}
            onClose={() => setShowUnsuspendModal(false)}
            onConfirm={handleUnsuspendConfirm}
            driverName={driverData?.name || 'Unknown Driver'}
            isLoading={isUnsuspending}
          />
          
          {/* Document Viewer Modal */}
          <DocumentViewModal
            isOpen={showDocumentModal}
            onClose={() => setShowDocumentModal(false)}
            document={selectedDocument}
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

