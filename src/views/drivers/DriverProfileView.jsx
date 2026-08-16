import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DriverProfileView.css';
import { logoutUser } from '../../services/authService';
import { fetchDriverDetails, fetchDriverWallet, approveDriver, suspendDriver, unsuspendDriver, updateDriver, updateDriverCommissionBalance, updateDriverMainWallet, deleteDriver, getDriverReviewsFromPayload, mapDriverRecentRide, mapAcceptanceRate, mapCancellationRate, formatDocumentLabel, resolveDriverProfileStatus, isDriverOnline, parseDriverBalance } from '../../services/driverService';
import UpdateDriverMainWalletModal from '../../components/modals/UpdateDriverMainWalletModal';
import { detectNewlyOnlineDrivers } from '../../utils/driverOnlineState';
import Toast from '../../components/common/Toast';
import SuspendDriverModal from '../../components/modals/SuspendDriverModal';
import UnsuspendDriverModal from '../../components/modals/UnsuspendDriverModal';
import EditDriverModal from '../../components/modals/EditDriverModal';
import DeleteDriverModal from '../../components/modals/DeleteDriverModal';
import UpdateDriverBalanceModal from '../../components/modals/UpdateDriverBalanceModal';
import DocumentViewModal from '../../components/modals/DocumentViewModal';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageToggle from '../../components/common/LanguageToggle';
import LazyLoader from '../../components/common/LazyLoader.jsx';
import UserAvatar from '../../components/common/UserAvatar';
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
    if (!status) return 'driver-profile-status-offline';
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'active':
      case 'online':
        return 'driver-profile-status-active';
      case 'offline': return 'driver-profile-status-offline';
      case 'suspended': return 'driver-profile-status-suspended';
      case 'pending verification':
      case 'pending':
      case 'awaiting verification':
        return 'driver-profile-status-pending';
      default: return 'driver-profile-status-offline';
    }
  };

  return <span className={`driver-profile-status-badge ${getStatusClass(status)}`}>{translateApiLabel(status || 'pending')}</span>;
};

export default function DriverProfileView() {
  const navigate = useNavigate();
  const { driverId } = useParams();
  const { t, formatNumber, formatCurrency, formatDate, formatDateTime, translateApiLabel } = useLanguage();
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

  // Balance modal and loading states
  const [showCommissionBalanceModal, setShowCommissionBalanceModal] = useState(false);
  const [showMainWalletModal, setShowMainWalletModal] = useState(false);
  const [isUpdatingCommissionBalance, setIsUpdatingCommissionBalance] = useState(false);
  const [isUpdatingMainWallet, setIsUpdatingMainWallet] = useState(false);
  const [driverWallet, setDriverWallet] = useState(null);

  // Delete modal and loading states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Document viewer modal state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const driverStatusRef = useRef(null);
  const pollRequestIdRef = useRef(0);

  const applyDriverApiData = useCallback((apiDriver) => {
    const driverProfile = apiDriver.driver_profile || {};
    const driverStatus = resolveDriverProfileStatus(apiDriver);
    driverStatusRef.current = driverStatus;

    const driverReviews = getDriverReviewsFromPayload(apiDriver);

    const transformedData = {
      id: apiDriver.id || driverId,
      name: apiDriver.full_name || apiDriver.name || 'Unknown Driver',
      avatar: apiDriver.avatar_url || apiDriver.profile_picture || apiDriver.avatar || '',
      status: driverStatus,
      rating: parseFloat(apiDriver.rating || apiDriver.average_rating || 0),
      totalReviews: Number(
        apiDriver.total_reviews ?? apiDriver.reviews_count ?? driverReviews.length
      ) || 0,
      driverReviews,
      acceptanceRate: mapAcceptanceRate(apiDriver.acceptance_rate),
      totalRides: parseInt(apiDriver.total_rides || apiDriver.rides_count || 0, 10),
      ridesThisMonth: apiDriver.rides_this_month ?? null,
      totalEarnings: parseFloat(apiDriver.earnings?.total || apiDriver.total_earnings || 0),
      earningsThisMonth: parseFloat(apiDriver.earnings?.this_month || apiDriver.earnings_this_month || 0),
      earningsLastMonth: parseFloat(apiDriver.earnings?.last_month || 0) || null,
      walletBalance: parseDriverBalance(apiDriver),
      cancellationRate: mapCancellationRate(apiDriver.cancellation_rate),
      personalDetails: {
        fullName: apiDriver.full_name || apiDriver.name || 'Unknown Driver',
        email: apiDriver.email || 'No email provided',
        phone: apiDriver.phone || apiDriver.phone_number || 'No phone provided',
        address: apiDriver.address || driverProfile.address || 'Address not available',
        dateJoined: apiDriver.created_at || null,
      },
      vehicleDetails: {
        model: driverProfile.vehicle_model || apiDriver.vehicle_model || 'Not provided yet',
        type: driverProfile.vehicle_type || apiDriver.vehicle_type || 'Not provided yet',
        year: driverProfile.vehicle_year || apiDriver.vehicle_year || new Date().getFullYear(),
        licensePlate: driverProfile.vehicle_plate || apiDriver.vehicle_plate || apiDriver.license_plate || 'Not provided yet',
        color: driverProfile.vehicle_color || apiDriver.vehicle_color || 'Not provided yet',
        licenseNumber: driverProfile.license_number || apiDriver.license_number || 'Not provided yet',
        licenseExpiry: driverProfile.license_expiry || apiDriver.license_expiry || null,
        insuranceProvider: driverProfile.insurance_provider || apiDriver.insurance_provider || 'Not provided yet',
        insuranceExpiry: driverProfile.insurance_expiry || apiDriver.insurance_expiry || null,
        vin: driverProfile.vin || apiDriver.vin || 'Not available',
      },
      documents: (() => {
        let apiDocuments = null;

        if (apiDriver.documents && Array.isArray(apiDriver.documents) && apiDriver.documents.length > 0) {
          apiDocuments = apiDriver.documents;
        } else if (driverProfile.documents && Array.isArray(driverProfile.documents) && driverProfile.documents.length > 0) {
          apiDocuments = driverProfile.documents;
        } else if (apiDriver.uploaded_documents && Array.isArray(apiDriver.uploaded_documents) && apiDriver.uploaded_documents.length > 0) {
          apiDocuments = apiDriver.uploaded_documents;
        } else if (apiDriver.driver_documents && Array.isArray(apiDriver.driver_documents) && apiDriver.driver_documents.length > 0) {
          apiDocuments = apiDriver.driver_documents;
        } else if (apiDriver.document_urls && typeof apiDriver.document_urls === 'object') {
          apiDocuments = Object.entries(apiDriver.document_urls).map(([key, url]) => ({
            document_type: key,
            document_url: url,
            status: 'Verified'
          }));
        } else if (driverProfile.document_urls && typeof driverProfile.document_urls === 'object') {
          apiDocuments = Object.entries(driverProfile.document_urls).map(([key, url]) => ({
            document_type: key,
            document_url: url,
            status: 'Verified'
          }));
        }

        if (apiDocuments && Array.isArray(apiDocuments) && apiDocuments.length > 0) {
          return apiDocuments.map(doc => {
            const docName = doc.document_name || doc.name || doc.type || doc.title
              ? formatDocumentLabel(doc.document_name || doc.name || doc.type || doc.title)
              : formatDocumentLabel(doc.document_type || 'Unknown Document');
            const docStatus = doc.status || doc.verification_status || doc.approval_status || 'pending';
            const docUrl = doc.accessible_url ||
              doc.signed_url ||
              doc.document_url ||
              doc.url ||
              doc.file_url ||
              doc.file_path ||
              doc.image_url ||
              doc.file ||
              doc.document_file_url ||
              doc.upload_url ||
              doc.preview_url ||
              doc.download_url ||
              (typeof doc === 'string' ? doc : null) ||
              null;

            let nestedUrl = null;
            if (doc.file && typeof doc.file === 'object') {
              nestedUrl = doc.file.url || doc.file.path || doc.file.file_url || null;
            }
            if (doc.document && typeof doc.document === 'object') {
              nestedUrl = nestedUrl || doc.document.url || doc.document.path || doc.document.file_url || null;
            }

            return {
              name: docName,
              status: docStatus,
              uploadDate: doc.upload_date || doc.uploaded_at || doc.created_at || null,
              url: docUrl || nestedUrl
            };
          });
        }

        const isVerified = apiDriver.is_verified === true || driverProfile.is_verified === true;
        const hasLicense = !!(driverProfile.license_number || apiDriver.license_number);
        const hasVehiclePlate = !!(driverProfile.vehicle_plate || apiDriver.vehicle_plate);
        const backgroundCheckStatus = driverProfile.background_check_status || apiDriver.background_check_status;

        const idDocUrl = apiDriver.id_document_url ||
          driverProfile.id_document_url ||
          apiDriver.id_document ||
          driverProfile.id_document ||
          apiDriver.qatari_id_url ||
          driverProfile.qatari_id_url ||
          null;

        const licenseDocUrl = apiDriver.license_document_url ||
          driverProfile.license_document_url ||
          apiDriver.license_document ||
          driverProfile.license_document ||
          apiDriver.driver_license_url ||
          driverProfile.driver_license_url ||
          null;

        const vehicleDocUrl = apiDriver.vehicle_registration_url ||
          driverProfile.vehicle_registration_url ||
          apiDriver.vehicle_registration ||
          driverProfile.vehicle_registration ||
          apiDriver.vehicle_registration_document ||
          driverProfile.vehicle_registration_document ||
          null;

        const bgCheckUrl = apiDriver.background_check_url ||
          driverProfile.background_check_url ||
          apiDriver.background_check_document ||
          driverProfile.background_check_document ||
          null;

        return [
          { name: 'Qatari ID', status: isVerified ? 'Verified' : 'Pending', url: idDocUrl },
          { name: "Driver's License", status: hasLicense ? 'Verified' : 'Pending', url: licenseDocUrl },
          { name: 'Vehicle Registration', status: hasVehiclePlate ? 'Verified' : 'Pending', url: vehicleDocUrl },
          { name: 'Background Check', status: backgroundCheckStatus === 'approved' ? 'Verified' : 'Pending', url: bgCheckUrl }
        ];
      })(),
      recentRides: (apiDriver.recent_rides || []).map(mapDriverRecentRide),
    };

    setDriverData(transformedData);
    return driverStatus;
  }, [driverId]);

  const loadDriverData = useCallback(async ({ silent = false } = {}) => {
    if (!driverId) {
      if (!silent) {
        setError('No driver ID provided');
        setIsLoading(false);
      }
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const [result, walletResult] = await Promise.all([
        fetchDriverDetails(driverId),
        fetchDriverWallet(driverId),
      ]);

      if (result.success && result.data) {
        applyDriverApiData(result.data);

        if (walletResult.success && walletResult.wallet) {
          setDriverWallet(walletResult.wallet);
          setDriverData((prev) =>
            prev ? { ...prev, walletBalance: walletResult.balance } : prev,
          );
        } else {
          setDriverWallet(null);
        }
      } else if (!silent) {
        setError(result.error || 'Failed to load driver details');
      }
    } catch (error) {
      if (!silent) {
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [driverId, applyDriverApiData]);

  useEffect(() => {
    driverStatusRef.current = null;
    loadDriverData();
  }, [loadDriverData]);

  useEffect(() => {
    if (!driverId) {
      return undefined;
    }

    const pollDriverStatus = async () => {
      if (document.hidden) {
        return;
      }

      const requestId = ++pollRequestIdRef.current;

      try {
        const result = await fetchDriverDetails(driverId);
        if (requestId !== pollRequestIdRef.current || !result.success || !result.data) {
          return;
        }

        const apiDriver = result.data;
        const newStatus = resolveDriverProfileStatus(apiDriver);
        const previousStatus = driverStatusRef.current;

        detectNewlyOnlineDrivers([{
          id: apiDriver.id || driverId,
          name: apiDriver.full_name || apiDriver.name || 'Driver',
          isOnline: isDriverOnline(apiDriver),
        }]);

        if (previousStatus !== null && previousStatus !== newStatus) {
          driverStatusRef.current = newStatus;

          if (newStatus === 'Online' || previousStatus === 'Online') {
            setDriverData((prev) => (prev && prev.status !== newStatus ? { ...prev, status: newStatus } : prev));
          }
        } else if (previousStatus === null) {
          driverStatusRef.current = newStatus;
        }
      } catch {
        // Ignore background poll errors
      }
    };

    const intervalId = setInterval(pollDriverStatus, 2000);
    return () => {
      pollRequestIdRef.current += 1;
      clearInterval(intervalId);
    };
  }, [driverId, t]);

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

  const handleCommissionBalanceClick = () => {
    setShowCommissionBalanceModal(true);
  };

  const handleMainWalletClick = () => {
    setShowMainWalletModal(true);
  };

  const refreshDriverWalletState = (wallet) => {
    if (!wallet) return;
    setDriverWallet(wallet);
    setDriverData((prev) => (prev ? { ...prev, walletBalance: wallet.totalBalance } : prev));
  };

  const handleCommissionBalanceConfirm = async ({ balance, reason, clearDebt }) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available',
      });
      return;
    }

    setIsUpdatingCommissionBalance(true);

    try {
      const result = await updateDriverCommissionBalance(driverId, {
        balance,
        reason,
        operation: 'set',
        clearDebt,
      });

      if (result.success) {
        refreshDriverWalletState(result.wallet);
        setShowCommissionBalanceModal(false);
        setToast({
          type: 'success',
          message: t('toast.driverCommissionBalanceUpdated'),
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate'),
        });
      }
    } catch (error) {
      console.error('❌ Update driver commission balance error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsUpdatingCommissionBalance(false);
    }
  };

  const handleMainWalletConfirm = async ({ operation, amount, reason }) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available',
      });
      return;
    }

    setIsUpdatingMainWallet(true);

    try {
      const result = await updateDriverMainWallet(driverId, {
        operation,
        amount,
        reason,
      });

      if (result.success) {
        refreshDriverWalletState(result.wallet);
        setShowMainWalletModal(false);
        setToast({
          type: 'success',
          message: t('toast.driverMainWalletUpdated'),
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToUpdate'),
        });
      }
    } catch (error) {
      console.error('❌ Update driver main wallet error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsUpdatingMainWallet(false);
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason) => {
    if (!driverId) {
      setToast({
        type: 'error',
        message: 'No driver ID available'
      });
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteDriver(driverId, reason);

      if (result.success) {
        setShowDeleteModal(false);
        setToast({
          type: 'success',
          message: t('toast.driverDeleted')
        });
        setTimeout(() => {
          navigate('/driver-management');
        }, 1200);
      } else {
        setToast({
          type: 'error',
          message: result.error || t('toast.failedToDelete')
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle document view click - opens modal
  const handleViewDocument = (document) => {
    console.log('👁️ VIEWING DOCUMENT:', {
      'Document': document,
      'Has URL': !!document.url,
      'URL': document.url,
      'Name': document.name,
      'Status': document.status,
      'Full Document Object': document
    });
    
    // If no URL, still show modal but it will display "not available" message
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
    } else if (navItem === 'marketers') {
      navigate('/marketers');
    } else if (navItem === 'partners') {
      navigate('/partners');
    } else if (navItem === 'influencers') {
      navigate('/influencers');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'financial') {
      navigate('/dashboard?section=financial');
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'notifications') {
      navigate('/notifications');
    } else if (navItem === 'app-update') {
      navigate('/app-update');
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
          {isLoading ? (
            <LazyLoader variant="content" lines={6} message={t('drivers.loadingDriverDetails')} />
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
              <UserAvatar
                src={driverData.avatar}
                name={driverData.name}
                className="driver-avatar-large"
              />
              <div className="driver-header-info">
                <div className="driver-name-row">
                  <h2 className="driver-name-large">{driverData.name}</h2>
                  <StatusBadge status={driverData.status} />
                </div>
                <div className="driver-rating">
                  <span className="star-icon-large">★</span>
                  <span className="rating-value">{driverData.rating.toFixed(2)}</span>
                  <span className="rating-reviews">({formatNumber(driverData.totalReviews)} {t('drivers.reviews')})</span>
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
              <button
                className="btn-delete"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                <span className="material-symbols-outlined">
                  {isDeleting ? 'hourglass_empty' : 'delete'}
                </span>
                {isDeleting ? t('modals.deleting') : t('drivers.delete')}
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.acceptanceRate')}</div>
              <div className="kpi-value">
                {driverData.acceptanceRate?.percentage != null
                  ? `${formatNumber(driverData.acceptanceRate.percentage)}%`
                  : t('common.notAvailable')}
              </div>
              {driverData.acceptanceRate?.total != null && (
                <div className="kpi-subtitle">
                  {t('drivers.acceptanceBreakdown', {
                    accepted: formatNumber(driverData.acceptanceRate.accepted ?? 0),
                    declined: formatNumber(driverData.acceptanceRate.declined ?? 0),
                    total: formatNumber(driverData.acceptanceRate.total),
                  })}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.totalRides')}</div>
              <div className="kpi-value">{formatNumber(driverData.totalRides)}</div>
              {driverData.cancellationRate?.completed != null && (
                <div className="kpi-subtitle">
                  {t('drivers.completedRidesCount', {
                    count: formatNumber(driverData.cancellationRate.completed),
                  })}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.totalEarnings')}</div>
              <div className="kpi-value">{formatCurrency(driverData.totalEarnings)}</div>
              <div className="kpi-subtitle earnings">
                {formatCurrency(driverData.earningsThisMonth)} {t('drivers.earningsThisMonth')}
              </div>
              {driverData.earningsLastMonth != null && (
                <div className="kpi-subtitle">
                  {t('drivers.lastMonth')}: {formatCurrency(driverData.earningsLastMonth)}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('drivers.cancellationRate')}</div>
              <div className="kpi-value cancellation">
                {driverData.cancellationRate?.percentage != null
                  ? `${formatNumber(driverData.cancellationRate.percentage)}%`
                  : t('common.notAvailable')}
              </div>
              {driverData.cancellationRate?.totalAssigned != null ? (
                <div className="kpi-subtitle">
                  {t('drivers.cancellationBreakdown', {
                    cancelled: formatNumber(driverData.cancellationRate.cancelled ?? 0),
                    assigned: formatNumber(driverData.cancellationRate.totalAssigned),
                  })}
                </div>
              ) : (
                <div className="kpi-subtitle">{t('drivers.belowTarget')}</div>
              )}
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
                <button 
                  className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  {t('drivers.driverReviews')} ({formatNumber(driverData.totalReviews)})
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
                      <span className="detail-value">{formatDate(driverData.personalDetails.dateJoined)}</span>
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
                      <span className="detail-label">{t('drivers.vehicleType')}</span>
                      <span className="detail-value">{translateApiLabel(driverData.vehicleDetails.type)}</span>
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
                      <span className="detail-label">{t('drivers.licenseNumber')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.licenseNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.licenseExpiry')}</span>
                      <span className="detail-value">{formatDate(driverData.vehicleDetails.licenseExpiry)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.insuranceProvider')}</span>
                      <span className="detail-value">{driverData.vehicleDetails.insuranceProvider}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">{t('drivers.insuranceExpiry')}</span>
                      <span className="detail-value">{formatDate(driverData.vehicleDetails.insuranceExpiry)}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="ride-history-table">
                    {driverData.recentRides.length === 0 ? (
                      <div className="driver-reviews-empty">{t('drivers.noRideHistory')}</div>
                    ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>{t('drivers.rideId')}</th>
                          <th>{t('drivers.rider')}</th>
                          <th>{t('drivers.route')}</th>
                          <th>{t('drivers.date')}</th>
                          <th>{t('drivers.fare')}</th>
                          <th>{t('common.status')}</th>
                          <th>{t('drivers.review')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driverData.recentRides.map((ride) => (
                          <tr key={ride.id}>
                            <td>#{String(ride.id).substring(0, 8)}</td>
                            <td>{ride.rider || t('common.notAvailable')}</td>
                            <td className="ride-route-cell">
                              {ride.pickupAddress || ride.dropoffAddress ? (
                                <>
                                  <span>{ride.pickupAddress || t('common.notAvailable')}</span>
                                  <span className="ride-route-arrow">→</span>
                                  <span>{ride.dropoffAddress || t('common.notAvailable')}</span>
                                </>
                              ) : (
                                t('common.notAvailable')
                              )}
                            </td>
                            <td>{ride.date ? formatDate(ride.date) : t('common.notAvailable')}</td>
                            <td>{formatCurrency(ride.fare)}</td>
                            <td><span className="status-completed">{translateApiLabel(ride.status)}</span></td>
                            <td className="ride-review-cell">
                              {ride.review ? (
                                <div className="ride-inline-review">
                                  <span className="ride-inline-review-rating">★ {ride.review.rating.toFixed(1)}</span>
                                  {ride.review.comment && (
                                    <span className="ride-inline-review-comment">{ride.review.comment}</span>
                                  )}
                                </div>
                              ) : (
                                t('drivers.noReview')
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="driver-reviews-list">
                    {driverData.driverReviews.length === 0 ? (
                      <div className="driver-reviews-empty">{t('drivers.noReviews')}</div>
                    ) : (
                      driverData.driverReviews.map((review) => (
                        <div key={review.id || `${review.rideId}-${review.createdAt}`} className="driver-review-card">
                          <div className="driver-review-header">
                            <div className="driver-review-rating">
                              <span className="star-icon-large">★</span>
                              <span>{review.rating.toFixed(1)}</span>
                            </div>
                            <span className="driver-review-date">
                              {review.createdAt ? formatDateTime(review.createdAt) : t('common.notAvailable')}
                            </span>
                          </div>
                          {review.comment ? (
                            <p className="driver-review-comment">{review.comment}</p>
                          ) : (
                            <p className="driver-review-comment muted">{t('drivers.noReviewComment')}</p>
                          )}
                          {review.rideId && (
                            <span className="driver-review-ride">
                              {t('drivers.rideId')}: #{String(review.rideId).substring(0, 8)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div className="profile-side-column">
              <div className="driver-wallet-card">
                <div className="driver-wallet-header">
                  <div>
                    <h3>{t('drivers.walletBalance')}</h3>
                    <div className="driver-wallet-balance">
                      {formatCurrency(driverWallet?.totalBalance ?? driverData.walletBalance ?? 0)}
                    </div>
                    <div className="driver-wallet-label">{t('drivers.totalBalance')}</div>
                  </div>
                  <div className="driver-wallet-actions">
                    <button
                      type="button"
                      className="btn-update-balance btn-update-main"
                      onClick={handleMainWalletClick}
                    >
                      <span className="material-symbols-outlined">payments</span>
                      {t('drivers.updateMainBalance')}
                    </button>
                    <button
                      type="button"
                      className="btn-update-balance btn-update-commission"
                      onClick={handleCommissionBalanceClick}
                    >
                      <span className="material-symbols-outlined">percent</span>
                      {t('drivers.updateCommissionBalance')}
                    </button>
                  </div>
                </div>

                {driverWallet?.found && (
                  <div className="driver-wallet-breakdown">
                    <div className="driver-wallet-row">
                      <span className="driver-wallet-row-label">{t('drivers.mainWallet')}</span>
                      <span className="driver-wallet-row-value">
                        {formatCurrency(driverWallet.mainWalletBalance)}
                      </span>
                    </div>
                    <div className="driver-wallet-row">
                      <span className="driver-wallet-row-label">{t('drivers.commissionWallet')}</span>
                      <span className="driver-wallet-row-value">
                        {formatCurrency(driverWallet.commissionBalance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="documents-panel">
              <h3>{t('drivers.uploadedDocuments')}</h3>
              {driverData.documents && driverData.documents.length > 0 ? (
                <div className="documents-list">
                  {driverData.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <div className="document-info">
                        <div className="document-name">
                          {doc.name}
                          {doc.url && (
                            <span className="document-has-url-indicator" title="Document available">
                              <span className="material-symbols-outlined">check_circle</span>
                            </span>
                          )}
                        </div>
                        <div className={`document-status ${String(doc.status).toLowerCase()}`}>
                          {translateApiLabel(doc.status)}
                        </div>
                      </div>
                      <button 
                        className="btn-view-document"
                        aria-label={t('modals.viewDocument')}
                        onClick={() => handleViewDocument(doc)}
                        title={doc.url ? 'View document' : 'Document URL not available - check console for details'}
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-documents">
                  <span className="material-symbols-outlined">description</span>
                  <p>No documents available</p>
                </div>
              )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
      
          {/* Update Driver Balance Modal */}
          <UpdateDriverBalanceModal
            isOpen={showCommissionBalanceModal}
            onClose={() => setShowCommissionBalanceModal(false)}
            onConfirm={handleCommissionBalanceConfirm}
            driverName={driverData?.name || 'Unknown Driver'}
            currentBalance={driverWallet?.commissionBalance ?? 0}
            isLoading={isUpdatingCommissionBalance}
          />

          <UpdateDriverMainWalletModal
            isOpen={showMainWalletModal}
            onClose={() => setShowMainWalletModal(false)}
            onConfirm={handleMainWalletConfirm}
            driverName={driverData?.name || 'Unknown Driver'}
            currentBalance={driverWallet?.mainWalletBalance ?? 0}
            isLoading={isUpdatingMainWallet}
          />

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

          {/* Delete Driver Modal */}
          <DeleteDriverModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
            driverName={driverData?.name || 'Unknown Driver'}
            isLoading={isDeleting}
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

