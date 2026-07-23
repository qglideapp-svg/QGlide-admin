import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReportsGeneratorView.css';
import { logoutUser } from '../../services/authService';
import { fetchReports, generateReport, deleteReport, retryReport, downloadReport, getReportOptions, searchReports, getDefaultReportConfig, getDefaultReportOptions } from '../../services/reportsService';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import notificationsIcon from '../../assets/icons/notifications.png';
import Toast from '../../components/common/Toast';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return 'status-ready';
    switch (status.toLowerCase()) {
      case 'ready': return 'status-ready';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      default: return 'status-ready';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function ReportsGeneratorView() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State for reports data
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // State for report configuration
  const [reportConfig, setReportConfig] = useState(getDefaultReportConfig());
  
  // State for report options
  const [reportOptions, setReportOptions] = useState(getDefaultReportOptions());

  useEffect(() => {
    loadReports();
    loadReportOptions();
  }, []);

  useEffect(() => {
    const hasProcessingReports = reports.some(
      (report) => report.status?.toLowerCase() === 'processing'
    );

    if (!hasProcessingReports) return undefined;

    const intervalId = setInterval(() => {
      loadReports(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [reports]);

  const loadReports = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const result = await fetchReports();
      if (result.success) {
        setReports(result.data);
      } else {
        showToastMessage(result.error || 'Failed to load reports', 'error');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      showToastMessage('Failed to load reports', 'error');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const loadReportOptions = async () => {
    try {
      const result = await getReportOptions();
      if (result.success) {
        setReportOptions(result.data);
        setReportConfig((prev) => ({
          ...prev,
          type: prev.type || result.data.reportTypes[0]?.value || getDefaultReportConfig().type,
          rideStatus: prev.rideStatus || result.data.rideStatuses[0]?.value || getDefaultReportConfig().rideStatus,
          format: prev.format || result.data.exportFormats[0]?.value || getDefaultReportConfig().format,
        }));
      }
    } catch (error) {
      console.error('Error loading report options:', error);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const closeToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.startDate || !reportConfig.endDate) {
      showToastMessage('Please select a start and end date', 'error');
      return;
    }

    if (reportConfig.startDate > reportConfig.endDate) {
      showToastMessage('Start date must be before end date', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateReport(reportConfig);
      if (result.success) {
        if (result.data) {
          setReports((prev) => [result.data, ...prev.filter((report) => report.id !== result.data.id)]);
        } else {
          loadReports(false);
        }
        showToastMessage(result.message || 'Report generation started', 'success');
        
        setReportConfig((prev) => ({
          ...prev,
          startDate: '',
          endDate: '',
          name: '',
        }));
      } else {
        showToastMessage(result.error || 'Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      showToastMessage('Failed to generate report', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const result = await deleteReport(reportId);
        if (result.success) {
          setReports(prev => prev.filter(report => report.id !== reportId));
          showToastMessage(result.message || 'Report deleted successfully', 'success');
        } else {
          showToastMessage(result.error || 'Failed to delete report', 'error');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        showToastMessage('Failed to delete report', 'error');
      }
    }
  };

  const handleRetryReport = async (reportId) => {
    try {
      const result = await retryReport(reportId);
      if (result.success) {
        showToastMessage(result.message || 'Report generation restarted', 'success');
        loadReports(false);
      } else {
        showToastMessage(result.error || 'Failed to retry report', 'error');
      }
    } catch (error) {
      console.error('Error retrying report:', error);
      showToastMessage('Failed to retry report', 'error');
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const result = await downloadReport(report.id, report.name, report.format);
      if (result.success) {
        showToastMessage('Report downloaded successfully', 'success');
      } else {
        showToastMessage(result.error || 'Failed to download report', 'error');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      showToastMessage('Failed to download report', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadReports();
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchReports(searchTerm);
      if (result.success) {
        setReports(result.data);
      } else {
        showToastMessage(result.error || 'Failed to search reports', 'error');
      }
    } catch (error) {
      console.error('Error searching reports:', error);
      showToastMessage('Failed to search reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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
    } else if (navItem === 'marketers') {
      navigate('/marketers');
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

  return (
    <div className={`reports-generator grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
          <NavItem icon="manage_accounts" label="Marketers" onClick={() => handleNavClick('marketers')} />
          <NavItem icon="account_balance_wallet" label="Financial" onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label="Withdrawals" onClick={() => handleNavClick('withdrawals')} />
                    <NavItem icon="notifications" label="Notifications" onClick={() => handleNavClick('notifications')} />
          <NavItem icon="system_update" label={t('navigation.appUpdate')} onClick={() => handleNavClick('app-update')} />
          <NavItem icon="support_agent" label="Support" onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label="Analytics" onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label="Reports" active={true} />
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
              <h1>Reports Generator</h1>
              <p className="sub">Generate and export custom data reports.</p>
            </div>
          </div>
          <div className="acts">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
            <ThemeToggle />
            <button className="notifications-btn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <span className="notification-dot"></span>
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
          {/* Create a New Report Section */}
          <div className="report-card create-report-card">
            <div className="card-header">
              <h2>Create a New Report</h2>
            </div>
            <div className="card-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Report Type</label>
                  <div className="dropdown-container">
                    <select
                      value={reportConfig.type}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, type: e.target.value }))}
                      className="form-select"
                    >
                      {reportOptions.reportTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <span className="dropdown-arrow material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Report Name (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Ride History"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Start Date</label>
                  <div className="date-input-container">
                    <input
                      type="date"
                      value={reportConfig.startDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                      className="form-input date-input"
                    />
                    <span className="date-icon material-symbols-outlined">calendar_month</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <div className="date-input-container">
                    <input
                      type="date"
                      value={reportConfig.endDate}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                      className="form-input date-input"
                    />
                    <span className="date-icon material-symbols-outlined">calendar_month</span>
                  </div>
                </div>

                {reportConfig.type === 'ride_history' && (
                  <div className="form-group">
                    <label>Ride Status</label>
                    <div className="dropdown-container">
                      <select
                        value={reportConfig.rideStatus}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, rideStatus: e.target.value }))}
                        className="form-select"
                      >
                        {reportOptions.rideStatuses.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                      <span className="dropdown-arrow material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Export Format</label>
                  <div className="radio-group">
                    {reportOptions.exportFormats.map((format) => (
                      <label key={format.value} className="radio-option">
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={reportConfig.format === format.value}
                          onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                        />
                        <span className="radio-label">{format.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="generate-btn"
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                <span className="material-symbols-outlined">settings</span>
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {/* Generated Reports Section */}
          <div className="report-card generated-reports-card">
            <div className="card-header">
              <h2>Generated Reports</h2>
              <a href="#" className="view-all-link">View All History</a>
            </div>
            <div className="card-content">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading reports...</p>
                </div>
              ) : (
                <div className="reports-table-container">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>REPORT NAME</th>
                        <th>DATE RANGE</th>
                        <th>GENERATED ON</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-reports-cell">No reports found.</td>
                        </tr>
                      ) : (
                      reports.map((report) => (
                        <tr key={report.id}>
                          <td className="report-name">{report.name}</td>
                          <td className="date-range">{report.dateRange}</td>
                          <td className="generated-on">{report.generatedOn}</td>
                          <td><StatusBadge status={report.status} /></td>
                          <td className="actions-cell">
                            <div className="action-buttons">
                              {report.status === 'Ready' && (
                                <button
                                  className="action-btn download-btn"
                                  onClick={() => handleDownloadReport(report)}
                                  title="Download"
                                >
                                  <span className="material-symbols-outlined">download</span>
                                </button>
                              )}
                              {report.status === 'Failed' && (
                                <button
                                  className="action-btn retry-btn"
                                  onClick={() => handleRetryReport(report.id)}
                                  title="Retry"
                                >
                                  <span className="material-symbols-outlined">refresh</span>
                                </button>
                              )}
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteReport(report.id)}
                                title="Delete"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={closeToast}
        />
      )}
    </div>
  );
}
