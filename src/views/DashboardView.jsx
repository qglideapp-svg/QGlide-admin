import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardView.css';
import logo from '../assets/images/logo.webp';
import routeIcon from '../assets/icons/route.png';
import moneyIcon from '../assets/icons/money.png';
import activeIcon from '../assets/icons/active.png';
import settingsIcon from '../assets/icons/settings.png';
import checkIcon from '../assets/icons/check.png';
import notificationsIcon from '../assets/icons/notifications.png';
import { fetchDashboardData, fetchRidesAnalytics } from '../services/dashboardService';
import { logoutUser } from '../services/authService';
import Toast from '../components/Toast';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function DashboardView() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  useEffect(() => {
    loadDashboardData();
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);

  const loadAnalyticsData = async () => {
    setIsAnalyticsLoading(true);
    
    try {
      const result = await fetchRidesAnalytics(selectedTimeframe);
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        console.error('Analytics error:', result.error);
        // Don't show toast for analytics errors, just log them
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboardData();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error);
        setShowToast(true);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    }
    // Add other navigation handlers as needed
  };

  const closeToast = () => {
    setShowToast(false);
    setError(null);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        const result = await logoutUser();
        
        if (result.success) {
          navigate('/login');
        } else {
          // Even if API fails, still redirect to login since token is cleared
          navigate('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect to login
        navigate('/login');
      }
    }
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return amount;
    return `QAR ${amount.toLocaleString()}`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return value;
    return `${value}%`;
  };

  return (
    <div className="dash grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" active />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label="Financial" />
          <NavItem icon="support_agent" label="Support" />
          <NavItem icon="insights" label="Analytics" />
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
            <h1>Dashboard Overview</h1>
            <p className="sub">Welcome back, Amina. Here's what's happening today.</p>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <button className="ibtn" aria-label="settings"><img src={settingsIcon} alt="settings" className="kimg" /></button>
            <button className="ibtn" aria-label="notifications"><img src={notificationsIcon} alt="notifications" className="kimg" /><i className="dot" /></button>
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
              <p>Loading dashboard data...</p>
            </div>
          ) : (
            <section className="kpis">
              <div className="kcard">
                <div className="khead"><span>Total Rides Today</span><span className="kbadge blue"><img src={routeIcon} alt="route" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.totalRidesToday ? formatNumber(dashboardData.totalRidesToday) : '0'}</div>
                <div className={`ksub ${dashboardData?.ridesGrowth && dashboardData.ridesGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.ridesGrowth ? `${dashboardData.ridesGrowth >= 0 ? '+' : ''}${dashboardData.ridesGrowth}% vs yesterday` : 'No data'}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>Total Revenue</span><span className="kbadge green"><img src={moneyIcon} alt="money" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.totalRevenue ? formatCurrency(dashboardData.totalRevenue) : 'QAR 0'}</div>
                <div className={`ksub ${dashboardData?.revenueGrowth && dashboardData.revenueGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.revenueGrowth ? `${dashboardData.revenueGrowth >= 0 ? '+' : ''}${dashboardData.revenueGrowth}% vs yesterday` : 'No data'}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>Active Drivers</span><span className="kbadge yellow"><img src={activeIcon} alt="active" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.activeDrivers ? formatNumber(dashboardData.activeDrivers) : '0'}</div>
                <div className="ksub">Online now</div>
              </div>
              <div className="kcard">
                <div className="khead"><span>Ride Success Rate</span><span className="kbadge purple"><img src={checkIcon} alt="check" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.successRate ? formatPercentage(dashboardData.successRate) : '0%'}</div>
                <div className={`ksub ${dashboardData?.successRateGrowth && dashboardData.successRateGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.successRateGrowth ? `${dashboardData.successRateGrowth >= 0 ? '+' : ''}${dashboardData.successRateGrowth}% vs yesterday` : 'No data'}
                </div>
              </div>
            </section>
          )}

          <section className="grid2">
            <div className="panel stretch">
              <div className="phead">
                <h3>Rides Over Time</h3>
                <div className="filters">
                  <button 
                    className={`chip ${selectedTimeframe === 'week' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`chip ${selectedTimeframe === 'month' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('month')}
                  >
                    Month
                  </button>
                  <button 
                    className={`chip ${selectedTimeframe === 'year' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('year')}
                  >
                    Year
                  </button>
                </div>
              </div>
              <div className="pbody">
                {isAnalyticsLoading ? (
                  <div className="analytics-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading analytics...</p>
                  </div>
                ) : analyticsData ? (
                  <div className="analytics-content">
                    {analyticsData.chartData && analyticsData.chartData.length > 0 ? (
                      <div className="chart-placeholder">
                        <p>Chart data available: {analyticsData.chartData.length} data points</p>
                        <div className="analytics-summary">
                          <div className="summary-item">
                            <span className="label">Total Rides:</span>
                            <span className="value">{analyticsData.totalRides ? formatNumber(analyticsData.totalRides) : 'N/A'}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Average Daily:</span>
                            <span className="value">{analyticsData.averageDaily ? formatNumber(analyticsData.averageDaily) : 'N/A'}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">Peak Day:</span>
                            <span className="value">{analyticsData.peakDay || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>No analytics data available for {selectedTimeframe} timeframe</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>Failed to load analytics data</p>
                  </div>
                )}
              </div>
            </div>
            <div className="panel">
              <div className="phead">
                <h3>Live Driver Map</h3>
                <button className="link">View All</button>
              </div>
              <div className="map" />
            </div>
          </section>
        </div>
      </main>
      
      {showToast && (
        <Toast 
          message={error || 'Failed to load dashboard data'} 
          type="error" 
          onClose={closeToast}
        />
      )}
    </div>
  );
}


