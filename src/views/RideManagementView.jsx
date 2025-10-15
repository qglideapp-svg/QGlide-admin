import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RideManagementView.css';
import { logoutUser } from '../services/authService';
import { fetchRidesList } from '../services/ridesService';
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
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'active': return 'status-active';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status || 'pending'}</span>;
};

const ActionButton = ({ icon, title, onClick }) => (
  <button className="action-btn" onClick={onClick} title={title}>
    <span className="material-symbols-outlined">{icon}</span>
  </button>
);

export default function RideManagementView() {
  console.log('RideManagementView component rendering...');
  
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [rides, setRides] = useState([]);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  useEffect(() => {
    console.log('🔄 useEffect triggered, page:', pagination.page);
    console.log('🔐 Checking auth token...');
    const token = localStorage.getItem('authToken');
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    loadRides();
  }, [pagination.page]);

  const loadRides = async () => {
    console.log('🚀 Starting loadRides function...');
    setIsLoading(true);
    setError(null);

    try {
      const filters = {
        page: pagination.page,
        pageSize: pagination.pageSize
      };

      console.log('📋 Filters:', filters);
      console.log('🔑 Calling fetchRidesList...');
      const result = await fetchRidesList(filters);
      console.log('📡 API result received:', result);
      
      if (result.success) {
        console.log('✅ API Response:', result.data);
        console.log('📊 API Response keys:', Object.keys(result.data));
        
        // Ensure rides is always an array
        let ridesData = [];
        if (Array.isArray(result.data)) {
          ridesData = result.data;
          console.log('📋 Data is direct array:', ridesData);
        } else if (result.data.rides && Array.isArray(result.data.rides)) {
          ridesData = result.data.rides;
          console.log('📋 Data found in .rides property:', ridesData);
        } else if (result.data.data && result.data.data.rides && Array.isArray(result.data.data.rides)) {
          ridesData = result.data.data.rides;
          console.log('📋 Data found in .data.rides property:', ridesData);
        } else if (result.data.data && Array.isArray(result.data.data)) {
          ridesData = result.data.data;
          console.log('📋 Data found in .data property:', ridesData);
        } else {
          console.log('⚠️ No rides array found in response structure');
          console.log('🔍 Full response structure:', JSON.stringify(result.data, null, 2));
        }
        
        console.log('🎯 Final processed rides data:', ridesData);
        setRides(ridesData);
        setPagination(prev => ({
          ...prev,
          total: result.data.data?.total || result.data.total || ridesData.length || 0,
          totalPages: result.data.data?.total_pages || result.data.totalPages || Math.ceil((result.data.data?.total || result.data.total || ridesData.length || 0) / prev.pageSize)
        }));
      } else {
        console.log('API error:', result.error);
        setError(result.error);
        setShowToast(true);
        // Show mock data as fallback
        setRides([
          {
            id: 'QG12345',
            user: { name: 'Fatima Al-Marri', phone: '+974 55123456', avatar: 'https://i.pravatar.cc/40?img=1' },
            driver: { name: 'Yusuf Ahmed', car: 'Toyota Camry' },
            date: '2025-10-07',
            time: '02:15 AM',
            fare: 'QAR 45.50',
            status: 'Completed'
          },
          {
            id: 'QG12346',
            user: { name: 'Omar Hassan', phone: '+974 55987654', avatar: 'https://i.pravatar.cc/40?img=2' },
            driver: { name: 'Ali Khan', car: 'Lexus ES' },
            date: '2025-10-07',
            time: '01:50 AM',
            fare: 'QAR 32.00',
            status: 'Active'
          }
        ]);
        setPagination(prev => ({ ...prev, total: 2, totalPages: 1 }));
      }
    } catch (err) {
      console.log('Load rides error:', err);
      setError('Failed to load rides - showing sample data');
      setShowToast(true);
      // Show mock data as fallback
      setRides([
        {
          id: 'QG12345',
          user: { name: 'Fatima Al-Marri', phone: '+974 55123456', avatar: 'https://i.pravatar.cc/40?img=1' },
          driver: { name: 'Yusuf Ahmed', car: 'Toyota Camry' },
          date: '2025-10-07',
          time: '02:15 AM',
          fare: 'QAR 45.50',
          status: 'Completed'
        },
        {
          id: 'QG12346',
          user: { name: 'Omar Hassan', phone: '+974 55987654', avatar: 'https://i.pravatar.cc/40?img=2' },
          driver: { name: 'Ali Khan', car: 'Lexus ES' },
          date: '2025-10-07',
          time: '01:50 AM',
          fare: 'QAR 32.00',
          status: 'Active'
        }
      ]);
      setPagination(prev => ({ ...prev, total: 2, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setShowToast(false);
    setError(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
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

  const handleRideClick = (rideId) => {
    navigate(`/ride-details/${rideId}`);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        const result = await logoutUser();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    }
  };

  // Debug mode - show component state
  if (process.env.NODE_ENV === 'development' && (!Array.isArray(rides) || rides.length === 0) && !isLoading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Poppins', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>🚗 Ride Management - Debug Mode</h1>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>Component State:</h3>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Rides Count:</strong> {rides.length}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
          <p><strong>Page:</strong> {pagination.page}</p>
          <p><strong>Total Pages:</strong> {pagination.totalPages}</p>
          <p><strong>Status:</strong> {rides.length === 0 && !isLoading && !error ? 'API returned empty data - Database has no rides' : 'Normal'}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => {
                console.log('🔄 Manual retry triggered');
                loadRides();
              }} 
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Retry Load Rides
            </button>
            <button 
              onClick={() => {
                setRides([
                  {
                    id: 'QG12345',
                    user: { name: 'Fatima Al-Marri', phone: '+974 55123456', avatar: 'https://i.pravatar.cc/40?img=1' },
                    driver: { name: 'Yusuf Ahmed', car: 'Toyota Camry' },
                    date: '2025-10-07',
                    time: '02:15 AM',
                    fare: 'QAR 45.50',
                    status: 'Completed'
                  },
                  {
                    id: 'QG12346',
                    user: { name: 'Omar Hassan', phone: '+974 55987654', avatar: 'https://i.pravatar.cc/40?img=2' },
                    driver: { name: 'Ali Khan', car: 'Lexus ES' },
                    date: '2025-10-07',
                    time: '01:50 AM',
                    fare: 'QAR 32.00',
                    status: 'Active'
                  }
                ]);
                setPagination(prev => ({ ...prev, total: 2, totalPages: 1 }));
                setIsLoading(false);
              }}
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Show Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wrap entire render in try-catch for error handling
  try {
  return (
    <div className={`ride-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" active={true} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
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
              <h1>Ride Management</h1>
              <p className="sub">Search, filter, and manage all platform rides.</p>
            </div>
          </div>
          <div className="acts">
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <button className="ibtn" aria-label="settings" onClick={() => navigate('/settings')}><img src={settingsIcon} alt="settings" className="kimg" /></button>
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
          <div className="ride-management-card">
            <div className="table-container">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading rides...</p>
                </div>
              ) : !Array.isArray(rides) || rides.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🚗</div>
                  <h3>No rides found</h3>
                  <p>There are no rides to display at the moment.</p>
                </div>
              ) : (
                <table className="rides-table">
                  <thead>
                    <tr>
                      <th>Ride ID</th>
                      <th>User</th>
                      <th>Driver</th>
                      <th>Date & Time</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(rides) ? rides : []).map((ride) => {
                      // Format date from API response
                      const rideDate = new Date(ride.created_at);
                      const formattedDate = rideDate.toLocaleDateString();
                      const formattedTime = rideDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                      
                      return (
                        <tr key={ride.id} className="ride-row" onClick={() => handleRideClick(ride.id)}>
                          <td className="ride-id">#{ride.id.substring(0, 8)}</td>
                          <td className="user-cell">
                            <div className="user-info">
                              <img 
                                src={ride.rider?.avatar_url || 'https://i.pravatar.cc/40?img=' + Math.floor(Math.random() * 10)} 
                                alt={ride.rider?.name || 'Unknown'} 
                                className="user-avatar" 
                              />
                              <div>
                                <div className="user-name">{ride.rider?.name || 'Unknown Rider'}</div>
                                <div className="user-phone">{ride.rider?.phone || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="driver-cell">
                            <div className="driver-info">
                              <div className="driver-name">{ride.driver?.name || 'No Driver Assigned'}</div>
                              <div className="driver-car">{ride.driver?.vehicle || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="datetime-cell">
                            <div className="datetime-info">
                              <div className="date">{formattedDate}</div>
                              <div className="time">{formattedTime}</div>
                            </div>
                          </td>
                          <td className="fare-cell">QAR {ride.fare ? (ride.fare / 100).toFixed(2) : '0.00'}</td>
                          <td><StatusBadge status={ride.status || 'pending'} /></td>
                          <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                            <div className="actions">
                              <ActionButton icon="visibility" title="View" onClick={() => handleRideClick(ride.id)} />
                              <ActionButton icon="edit" title="Edit" />
                              <ActionButton 
                                icon={ride.status === 'active' ? 'cancel' : 'delete'} 
                                title={ride.status === 'active' ? 'Cancel' : 'Delete'} 
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {Array.isArray(rides) && rides.length > 0 && pagination.totalPages > 1 && (
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
          message={error || 'Failed to load rides'} 
          type="error" 
          onClose={closeToast}
        />
      )}
    </div>
    );
  } catch (renderError) {
    console.error('💥 Render error in RideManagementView:', renderError);
    return (
      <div style={{ padding: '20px', fontFamily: 'Poppins', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>🚗 Ride Management - Error</h1>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>Render Error:</h3>
          <p><strong>Error:</strong> {renderError.message}</p>
          <p><strong>Stack:</strong> <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>{renderError.stack}</pre></p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}