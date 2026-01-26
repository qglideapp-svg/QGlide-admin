import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './WithdrawalManagementView.css';
import { logoutUser } from '../../services/authService';
import { fetchWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../services/financialService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import ApproveWithdrawalModal from '../../components/modals/ApproveWithdrawalModal';
import RejectWithdrawalModal from '../../components/modals/RejectWithdrawalModal';
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
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status || 'Pending'}</span>;
};

export default function WithdrawalManagementView() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const [processingId, setProcessingId] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const loadWithdrawals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading withdrawals with filters:', { status: statusFilter, page: pagination.page, pageSize: pagination.pageSize });
      const result = await fetchWithdrawals({
        status: statusFilter,
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      console.log('Fetch withdrawals result:', result);

      if (result && result.success) {
        const withdrawalsData = Array.isArray(result.data) ? result.data : [];
        console.log('Setting withdrawals data:', withdrawalsData);
        setWithdrawals(withdrawalsData);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || withdrawalsData.length || 0,
          totalPages: result.pagination?.totalPages || Math.ceil((result.pagination?.total || withdrawalsData.length || 0) / prev.pageSize)
        }));
        setError(null); // Clear any previous errors
      } else {
        console.error('Fetch withdrawals failed:', result);
        setError(result?.error || 'Failed to load withdrawals');
        setShowToast(true);
        setWithdrawals([]); // Set empty array on error
      }
    } catch (err) {
      console.error('Load withdrawals error:', err);
      setError('Failed to load withdrawals');
      setShowToast(true);
      setWithdrawals([]); // Ensure withdrawals is always an array
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0
      }));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
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
    }
  };

  const handleApproveClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async (adminNotes) => {
    if (!selectedWithdrawal) return;
    
    setProcessingId(selectedWithdrawal.id);
    setShowApproveModal(false);
    
    try {
      const result = await approveWithdrawal(selectedWithdrawal.id, adminNotes);
      if (result.success) {
        setShowToast(true);
        setError(null);
        // Reload withdrawals
        await loadWithdrawals();
      } else {
        setError(result.error || 'Failed to approve withdrawal');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Approve withdrawal error:', err);
      setError('Failed to approve withdrawal');
      setShowToast(true);
    } finally {
      setProcessingId(null);
      setSelectedWithdrawal(null);
    }
  };

  const handleRejectClick = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async (rejectionReason) => {
    if (!selectedWithdrawal) return;
    
    setProcessingId(selectedWithdrawal.id);
    setShowRejectModal(false);
    
    try {
      const result = await rejectWithdrawal(selectedWithdrawal.id, rejectionReason);
      if (result.success) {
        setShowToast(true);
        setError(null);
        // Reload withdrawals
        await loadWithdrawals();
      } else {
        setError(result.error || 'Failed to reject withdrawal');
        setShowToast(true);
      }
    } catch (err) {
      console.error('Reject withdrawal error:', err);
      setError('Failed to reject withdrawal');
      setShowToast(true);
    } finally {
      setProcessingId(null);
      setSelectedWithdrawal(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'QAR 0.00';
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount)) return 'QAR 0.00';
    return `QAR ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredWithdrawals = React.useMemo(() => {
    try {
      const withdrawalsArray = Array.isArray(withdrawals) ? withdrawals : [];
      return withdrawalsArray.filter(w => {
        if (!w || typeof w !== 'object') return false;
        if (statusFilter === 'All') return true;
        const withdrawalStatus = (w.status || '').toLowerCase();
        return withdrawalStatus === statusFilter.toLowerCase();
      });
    } catch (error) {
      console.error('Error filtering withdrawals:', error);
      return [];
    }
  }, [withdrawals, statusFilter]);

  // Safety check - ensure component always renders
  if (typeof filteredWithdrawals === 'undefined') {
    console.error('filteredWithdrawals is undefined');
    return (
      <div className="withdrawal-management grid-root">
        <div className="container">
          <div className="error-state">
            <h3>Error loading withdrawals</h3>
            <p>Please refresh the page or contact support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`withdrawal-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label="Financial" onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label="Withdrawals" active={true} />
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
              <div className="name">QGlide Admin</div>
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
              <h1>Withdrawal Management</h1>
              <p className="sub">Review and approve driver withdrawal requests.</p>
            </div>
          </div>
          <div className="acts">
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <ThemeToggle />
            <button className="ibtn" aria-label="settings" onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <button className="ibtn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label="logout" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="withdrawal-management-card">
            <div className="card-header">
              <div className="header-left">
                <h2>Driver Withdrawal Requests</h2>
                <p className="withdrawal-count">Total: {pagination.total} requests</p>
              </div>
              <div className="header-filters">
                <select 
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading withdrawals...</p>
                </div>
              ) : filteredWithdrawals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <h3>No withdrawal requests found</h3>
                  <p>There are no withdrawal requests to display at the moment.</p>
                </div>
              ) : (
                <table className="withdrawals-table">
                  <thead>
                    <tr>
                      <th>DRIVER</th>
                      <th>AMOUNT</th>
                      <th>BANK DETAILS</th>
                      <th>REQUEST DATE</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((withdrawal) => {
                      if (!withdrawal || !withdrawal.id) {
                        console.warn('Invalid withdrawal entry:', withdrawal);
                        return null;
                      }
                      return (
                        <tr key={withdrawal.id} className="withdrawal-row">
                          <td className="driver-cell">
                            <div className="driver-info">
                              {withdrawal.driver_avatar ? (
                                <img 
                                  src={withdrawal.driver_avatar} 
                                  alt={withdrawal.driver_name || 'Driver'} 
                                  className="driver-avatar" 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="driver-avatar-placeholder">N/A</div>
                              )}
                              <div>
                                <div className="driver-name">
                                  {typeof withdrawal.driver_name === 'string' 
                                    ? withdrawal.driver_name 
                                    : (withdrawal.driver_name?.name || withdrawal.driver_name?.driver_name || 'N/A')}
                                </div>
                                <div className="driver-id">
                                  ID: {typeof withdrawal.driver_id === 'string' 
                                    ? withdrawal.driver_id 
                                    : (withdrawal.driver_id?.id || withdrawal.driver_id || withdrawal.id || 'N/A')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(withdrawal.amount)}</td>
                          <td className="bank-cell">
                            <div className="bank-info">
                              <div className="bank-name">{withdrawal.bank_name || 'N/A'}</div>
                              <div className="bank-account">{withdrawal.bank_account || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="date-cell">{withdrawal.request_date || 'N/A'}</td>
                          <td><StatusBadge status={withdrawal.status} /></td>
                        <td className="actions-cell">
                          {withdrawal.status?.toLowerCase() === 'pending' && (
                            <div className="actions">
                              <button 
                                className="action-btn approve-btn" 
                                onClick={() => handleApproveClick(withdrawal)}
                                disabled={processingId === withdrawal.id}
                                title="Approve"
                              >
                                <span className="material-symbols-outlined">
                                  {processingId === withdrawal.id ? 'hourglass_empty' : 'check_circle'}
                                </span>
                                {processingId === withdrawal.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button 
                                className="action-btn reject-btn" 
                                onClick={() => handleRejectClick(withdrawal)}
                                disabled={processingId === withdrawal.id}
                                title="Reject"
                              >
                                <span className="material-symbols-outlined">cancel</span>
                                Reject
                              </button>
                            </div>
                          )}
                          {withdrawal.status?.toLowerCase() !== 'pending' && (
                            <span className="no-actions">No actions available</span>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {!isLoading && filteredWithdrawals.length > 0 && pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ‹
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button 
                  className="page-btn" 
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {showToast && (
        <Toast 
          message={error || 'Operation completed successfully'} 
          type={error ? 'error' : 'success'} 
          onClose={() => {
            setShowToast(false);
            setError(null);
          }}
        />
      )}
      
      <ApproveWithdrawalModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedWithdrawal(null);
        }}
        onConfirm={handleApproveConfirm}
        withdrawalData={selectedWithdrawal}
        isLoading={processingId === selectedWithdrawal?.id}
      />
      
      <RejectWithdrawalModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedWithdrawal(null);
        }}
        onConfirm={handleRejectConfirm}
        withdrawalData={selectedWithdrawal}
        isLoading={processingId === selectedWithdrawal?.id}
      />
    </div>
  );
}
