import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagementView.css';
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
    if (!status) return 'status-inactive';
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return 'status-inactive';
    }
  };

  return <span className={`status-badge ${getStatusClass(status)}`}>{status}</span>;
};

export default function UserManagementView() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [users, setUsers] = useState([
    {
      id: 'USER_001',
      name: 'Khalid Al-Marri',
      avatar: 'https://i.pravatar.cc/40?img=1',
      joinedDate: '2023-08-07',
      contact: '+974 5512 3456',
      totalRides: 128,
      lastRide: '2025-10-06',
      rating: 4.9,
      status: 'Active'
    },
    {
      id: 'USER_002',
      name: 'Fatima Al-Kuwari',
      avatar: 'https://i.pravatar.cc/40?img=5',
      joinedDate: '2024-10-07',
      contact: 'fatima.k@example.com',
      totalRides: 342,
      lastRide: '2025-10-05',
      rating: 5.0,
      status: 'Active'
    },
    {
      id: 'USER_003',
      name: 'Youssef Hassan',
      avatar: 'https://i.pravatar.cc/40?img=3',
      joinedDate: '2025-09-16',
      contact: '+974 5598 7654',
      totalRides: 21,
      lastRide: '2025-10-04',
      rating: 4.7,
      status: 'Active'
    },
    {
      id: 'USER_004',
      name: 'Mariam Al-Thani',
      avatar: 'https://i.pravatar.cc/40?img=9',
      joinedDate: '2024-05-12',
      contact: 'mariam.t@example.com',
      totalRides: 256,
      lastRide: '2025-10-03',
      rating: 4.8,
      status: 'Active'
    },
    {
      id: 'USER_005',
      name: 'Ahmed Al-Mansouri',
      avatar: 'https://i.pravatar.cc/40?img=7',
      joinedDate: '2023-11-20',
      contact: '+974 5543 2109',
      totalRides: 189,
      lastRide: '2025-09-30',
      rating: 4.6,
      status: 'Inactive'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('Any');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setRatingFilter('Any');
  };

  const handleUserClick = (userId) => {
    navigate(`/user-profile/${userId}`);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const matchesRating = ratingFilter === 'Any' || 
                         (ratingFilter === '4.5+' && user.rating >= 4.5) ||
                         (ratingFilter === '4.0+' && user.rating >= 4.0);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  return (
    <div className={`user-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" active={true} />
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
              <h1>User Management</h1>
              <p className="sub">View, manage, and interact with all registered users.</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <button className="ibtn" aria-label="settings" onClick={() => navigate('/settings')}><img src={settingsIcon} alt="settings" className="kimg" /></button>
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
          <div className="user-management-card">
            <div className="card-header">
              <div className="header-left">
                <h2>All Users</h2>
                <p className="user-count">Total of {users.length.toLocaleString()} users</p>
              </div>
              <div className="header-actions">
                <button className="btn-export">
                  <span className="material-symbols-outlined">upload</span>
                  Export
                </button>
                <button className="btn-add-user">
                  <span className="material-symbols-outlined">add</span>
                  Add User
                </button>
              </div>
            </div>

            <div className="filters-row">
              <div className="search-filter">
                <span className="material-symbols-outlined">search</span>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Inactive">Status: Inactive</option>
                <option value="Suspended">Status: Suspended</option>
              </select>
              <select 
                className="filter-select"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="Any">Rating: Any</option>
                <option value="4.5+">Rating: 4.5+</option>
                <option value="4.0+">Rating: 4.0+</option>
              </select>
              <button className="clear-filters" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>

            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      />
                    </th>
                    <th>USER</th>
                    <th>CONTACT</th>
                    <th>TOTAL RIDES</th>
                    <th>LAST RIDE</th>
                    <th>RATING</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="user-row" onClick={() => handleUserClick(user.id)} style={{ cursor: 'pointer' }}>
                      <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="user-cell">
                        <div className="user-info-cell">
                          <img src={user.avatar} alt={user.name} className="user-avatar" />
                          <div>
                            <div className="user-name-text">{user.name}</div>
                            <div className="user-joined">Joined {getTimeAgo(user.joinedDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="contact-cell">{user.contact}</td>
                      <td className="rides-cell">{user.totalRides}</td>
                      <td className="date-cell">{user.lastRide}</td>
                      <td className="rating-cell">
                        <span className="star-icon">★</span> {user.rating.toFixed(1)}
                      </td>
                      <td><StatusBadge status={user.status} /></td>
                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button className="action-menu-btn" aria-label="Actions">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

