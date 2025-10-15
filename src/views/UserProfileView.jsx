import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './UserProfileView.css';
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

  // Mock user data - in production, this would come from an API
  const [userData] = useState({
    id: userId || 'QG-84321',
    name: 'Fahad Al-Marri',
    avatar: 'https://i.pravatar.cc/120?img=1',
    status: 'Active',
    email: 'fahad.almarri@example.com',
    phone: '+974 5512 3456',
    joinedDate: '15 Aug, 2024',
    walletBalance: 258.50,
    lastTopUp: '01 Oct 2025',
    totalRides: 124,
    rideHistory: [
      {
        id: 'RD-98754',
        date: '05 Oct 2025, 10:30 AM',
        route: { from: 'The Pearl', to: 'Hamad Airport' },
        driver: 'Yusuf Ahmed',
        fare: 85.00,
        status: 'Completed'
      },
      {
        id: 'RD-98712',
        date: '03 Oct 2025, 08:00 PM',
        route: { from: 'Villaggio Mall', to: 'West Bay' },
        driver: 'Ali Khan',
        fare: 42.50,
        status: 'Completed'
      },
      {
        id: 'RD-98650',
        date: '01 Oct 2025, 09:15 AM',
        route: { from: 'Education City', to: 'Souq Waqif' },
        driver: 'Mohammed Hassan',
        fare: 60.00,
        status: 'Canceled'
      },
      {
        id: 'RD-98599',
        date: '28 Sep 2025, 06:45 PM',
        route: { from: 'Lusail Marina', to: 'Katara' },
        driver: 'Omar Abdullah',
        fare: 35.00,
        status: 'Completed'
      }
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
                    <button className="btn-reset-password">
                      <span className="material-symbols-outlined">key</span>
                      Reset Password
                    </button>
                    <button className="btn-deactivate">
                      <span className="material-symbols-outlined">block</span>
                      Deactivate Account
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
                    <button className="btn-view-history">View History</button>
                    <button className="btn-add-funds">Add Funds</button>
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
        </div>
      </main>
    </div>
  );
}

