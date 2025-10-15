import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DriverProfileView.css';
import { logoutUser } from '../services/authService';
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
  const [activeTab, setActiveTab] = useState('personal');

  // Mock driver data - in production, this would come from an API
  const [driverData] = useState({
    id: driverId || 'DRV_001',
    name: 'Yusuf Al-Hajri',
    avatar: 'https://i.pravatar.cc/120?img=1',
    status: 'Active',
    rating: 4.92,
    totalReviews: 1245,
    acceptanceRate: 96,
    totalRides: 2819,
    ridesThisMonth: 142,
    totalEarnings: 82450,
    earningsThisMonth: 4120,
    cancellationRate: 1.8,
    personalDetails: {
      fullName: 'Yusuf Al-Hajri',
      email: 'y.alhajri@example.com',
      phone: '+974 5512 3456',
      address: 'Al Sadd, Doha, Qatar',
      dateJoined: '15 Aug, 2023'
    },
    vehicleDetails: {
      model: 'Toyota Camry',
      year: 2022,
      licensePlate: 'ABC 1234',
      color: 'White',
      vin: '1HGBH41JXMN109186'
    },
    documents: [
      { name: 'Qatari ID', status: 'Verified' },
      { name: "Driver's License", status: 'Verified' },
      { name: 'Vehicle Registration', status: 'Pending' }
    ],
    recentRides: [
      { id: 'R001', rider: 'Ahmed Ali', date: '2025-10-14', fare: 45.50, status: 'Completed' },
      { id: 'R002', rider: 'Fatima Hassan', date: '2025-10-14', fare: 32.00, status: 'Completed' },
      { id: 'R003', rider: 'Omar Khalid', date: '2025-10-13', fare: 28.75, status: 'Completed' }
    ]
  });

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
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" active={true} onClick={() => handleNavClick('driver-management')} />
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

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>Driver Profile</h1>
            <div className="breadcrumbs">
              <span className="breadcrumb-link" onClick={handleBackToDrivers}>Driver Management</span>
              <span className="breadcrumb-separator"> &gt; </span>
              <span className="breadcrumb-current">{driverData.name}</span>
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
                  <span className="rating-reviews">({driverData.totalReviews.toLocaleString()} reviews)</span>
                </div>
              </div>
            </div>
            <div className="driver-header-actions">
              <button className="btn-edit-profile">
                <span className="material-symbols-outlined">edit</span>
                Edit Profile
              </button>
              <button className="btn-suspend">
                <span className="material-symbols-outlined">block</span>
                Suspend
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Acceptance Rate</div>
              <div className="kpi-value">{driverData.acceptanceRate}%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Rides</div>
              <div className="kpi-value">{driverData.totalRides.toLocaleString()}</div>
              <div className="kpi-subtitle">This month: {driverData.ridesThisMonth}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Earnings</div>
              <div className="kpi-value">QAR {driverData.totalEarnings.toLocaleString()}</div>
              <div className="kpi-subtitle earnings">QAR {driverData.earningsThisMonth.toLocaleString()} this month</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Cancellation Rate</div>
              <div className="kpi-value cancellation">{driverData.cancellationRate}%</div>
              <div className="kpi-subtitle">Below 5% target</div>
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
                  Personal Details
                </button>
                <button 
                  className={`tab ${activeTab === 'vehicle' ? 'active' : ''}`}
                  onClick={() => setActiveTab('vehicle')}
                >
                  Vehicle Details
                </button>
                <button 
                  className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Ride History
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'personal' && (
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="detail-label">Full Name</span>
                      <span className="detail-value">{driverData.personalDetails.fullName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{driverData.personalDetails.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone Number</span>
                      <span className="detail-value">{driverData.personalDetails.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{driverData.personalDetails.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date Joined</span>
                      <span className="detail-value">{driverData.personalDetails.dateJoined}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'vehicle' && (
                  <div className="details-list">
                    <div className="detail-item">
                      <span className="detail-label">Vehicle Model</span>
                      <span className="detail-value">{driverData.vehicleDetails.model}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Year</span>
                      <span className="detail-value">{driverData.vehicleDetails.year}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">License Plate</span>
                      <span className="detail-value">{driverData.vehicleDetails.licensePlate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Color</span>
                      <span className="detail-value">{driverData.vehicleDetails.color}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">VIN</span>
                      <span className="detail-value">{driverData.vehicleDetails.vin}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="ride-history-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ride ID</th>
                          <th>Rider</th>
                          <th>Date</th>
                          <th>Fare</th>
                          <th>Status</th>
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
              <h3>Uploaded Documents</h3>
              <div className="documents-list">
                {driverData.documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="document-info">
                      <div className="document-name">{doc.name}</div>
                      <div className={`document-status ${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </div>
                    </div>
                    <button className="btn-view-document" aria-label="View document">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

