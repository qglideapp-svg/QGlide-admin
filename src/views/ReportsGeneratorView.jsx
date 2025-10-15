import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReportsGeneratorView.css';
import { logoutUser } from '../services/authService';
import { fetchReports, generateReport, deleteReport, retryReport, downloadReport, getReportOptions, searchReports } from '../services/reportsService';
import logo from '../assets/images/logo.webp';
import settingsIcon from '../assets/icons/settings.png';
import notificationsIcon from '../assets/icons/notifications.png';
import Toast from '../components/Toast';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
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
  
  // State for reports data
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // State for report configuration
  const [reportConfig, setReportConfig] = useState({
    type: 'Ride History',
    dateRange: '',
    rideStatus: 'All Statuses',
    format: 'CSV'
  });
  
  // State for report options
  const [reportOptions, setReportOptions] = useState({
    reportTypes: [],
    rideStatuses: [],
    exportFormats: []
  });

  useEffect(() => {
    loadReports();
    loadReportOptions();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const result = await fetchReports();
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      showToastMessage('Failed to load reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportOptions = async () => {
    try {
      const result = await getReportOptions();
      if (result.success) {
        setReportOptions(result.data);
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
    if (!reportConfig.dateRange) {
      showToastMessage('Please select a date range', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateReport(reportConfig);
      if (result.success) {
        setReports(prev => [result.data, ...prev]);
        showToastMessage('Report generation started', 'success');
        
        // Reset form
        setReportConfig(prev => ({
          ...prev,
          dateRange: ''
        }));
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
          showToastMessage('Report deleted successfully', 'success');
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
        showToastMessage('Report generation restarted', 'success');
        loadReports(); // Refresh the list
      }
    } catch (error) {
      console.error('Error retrying report:', error);
      showToastMessage('Failed to retry report', 'error');
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      const result = await downloadReport(reportId);
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
      }
    } catch (error) {
      console.error('Error searching reports:', error);
      showToastMessage('Failed to search reports', 'error');
    } finally {
      setIsLoading(false);
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
    <div className="reports-generator grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label="Financial" onClick={() => handleNavClick('financial')} />
          <NavItem icon="support_agent" label="Support" onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label="Analytics" onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label="Reports" active={true} />
        </nav>

        <div className="sfoot">
          <button className="settings" type="button">
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
            <h1>Reports Generator</h1>
            <p className="sub">Generate and export custom data reports.</p>
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
            <button className="theme-toggle" aria-label="dark mode">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <button className="notifications-btn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <span className="notification-dot"></span>
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
                      {reportOptions.reportTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <span className="dropdown-arrow material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Date Range</label>
                  <div className="date-input-container">
                    <input
                      type="text"
                      placeholder="Select date range"
                      value={reportConfig.dateRange}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="form-input date-input"
                    />
                    <span className="date-icon material-symbols-outlined">calendar_month</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ride Status</label>
                  <div className="dropdown-container">
                    <select
                      value={reportConfig.rideStatus}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, rideStatus: e.target.value }))}
                      className="form-select"
                    >
                      {reportOptions.rideStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <span className="dropdown-arrow material-symbols-outlined">expand_more</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Export Format</label>
                  <div className="radio-group">
                    {reportOptions.exportFormats.map(format => (
                      <label key={format} className="radio-option">
                        <input
                          type="radio"
                          name="format"
                          value={format}
                          checked={reportConfig.format === format}
                          onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
                        />
                        <span className="radio-label">{format}</span>
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
                      {reports.map((report) => (
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
                                  onClick={() => handleDownloadReport(report.id)}
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
                      ))}
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
