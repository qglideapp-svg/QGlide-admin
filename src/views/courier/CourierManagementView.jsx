import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourierManagementView.css';
import { logoutUser } from '../../services/authService';
import Toast from '../../components/common/Toast';
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
    if (!status) return 'courier-status-pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'courier-status-completed';
      case 'in_transit': 
      case 'in-transit':
      case 'in transit': return 'courier-status-in-transit';
      case 'picked_up':
      case 'picked-up':
      case 'picked up': return 'courier-status-picked-up';
      case 'pending': return 'courier-status-pending';
      case 'cancelled': return 'courier-status-cancelled';
      default: return 'courier-status-pending';
    }
  };

  return <span className={`courier-status-badge ${getStatusClass(status)}`}>{status || 'pending'}</span>;
};

export default function CourierManagementView() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    inTransit: 0,
    completed: 0,
    pending: 0
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Mock data for now - replace with API call
  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockCouriers = [
        {
          id: 'CR-001',
          orderNumber: 'ORD-2025-001',
          sender: { name: 'Mohammed Al-Thani', phone: '+974 55123456', address: 'West Bay, Doha' },
          recipient: { name: 'Fatima Al-Marri', phone: '+974 55987654', address: 'The Pearl, Doha' },
          item: 'Electronics Package',
          date: '2025-10-07',
          time: '10:30 AM',
          status: 'in_transit',
          deliveryFee: 'QAR 25.00',
          driver: { name: 'Ahmed Khan', vehicle: 'Toyota Hiace' }
        },
        {
          id: 'CR-002',
          orderNumber: 'ORD-2025-002',
          sender: { name: 'Sara Al-Kuwari', phone: '+974 55234567', address: 'Al Sadd, Doha' },
          recipient: { name: 'Omar Hassan', phone: '+974 55345678', address: 'Doha City Center' },
          item: 'Document Package',
          date: '2025-10-07',
          time: '11:15 AM',
          status: 'picked_up',
          deliveryFee: 'QAR 15.00',
          driver: { name: 'Yusuf Ahmed', vehicle: 'Ford Transit' }
        },
        {
          id: 'CR-003',
          orderNumber: 'ORD-2025-003',
          sender: { name: 'Noor Al-Mansoori', phone: '+974 55456789', address: 'Al Rayyan, Doha' },
          recipient: { name: 'Jassim Al-Kuwari', phone: '+974 55567890', address: 'Msheireb, Doha' },
          item: 'Food Delivery',
          date: '2025-10-07',
          time: '09:45 AM',
          status: 'completed',
          deliveryFee: 'QAR 18.00',
          driver: { name: 'Farhan Khan', vehicle: 'Nissan NV200' }
        },
        {
          id: 'CR-004',
          orderNumber: 'ORD-2025-004',
          sender: { name: 'Mariam Al-Suwaidi', phone: '+974 55678901', address: 'Al Wakrah, Doha' },
          recipient: { name: 'Khalid Al-Attiyah', phone: '+974 55789012', address: 'Lusail, Doha' },
          item: 'Fragile Package',
          date: '2025-10-07',
          time: '02:30 PM',
          status: 'pending',
          deliveryFee: 'QAR 35.00',
          driver: null
        }
      ];
      
      setCouriers(mockCouriers);
      setStats({
        totalOrders: mockCouriers.length,
        inTransit: mockCouriers.filter(c => c.status === 'in_transit').length,
        completed: mockCouriers.filter(c => c.status === 'completed').length,
        pending: mockCouriers.filter(c => c.status === 'pending').length
      });
      setIsLoading(false);
    }, 500);
  }, []);

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
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
    }
  };

  const handleCourierClick = (courierId) => {
    // Navigate to courier details
    console.log('View courier details:', courierId);
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

  const filteredCouriers = couriers.filter(courier => {
    const matchesSearch = 
      courier.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courier.item.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || courier.status === statusFilter.toLowerCase().replace(' ', '_');
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`courier-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
              <h1>Courier Management</h1>
              <p className="sub">Track and manage all courier deliveries and shipments.</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <button className="ibtn" aria-label="settings" onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
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
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{stats.totalOrders}</div>
              </div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">In Transit</div>
                <div className="stat-value">{stats.inTransit}</div>
              </div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completed}</div>
              </div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-icon">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending</div>
                <div className="stat-value">{stats.pending}</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="courier-management-card">
            <div className="filters-section">
              <div className="search-input">
                <span className="material-symbols-outlined">search</span>
                <input 
                  type="text" 
                  placeholder="Search by order number, sender, recipient, or item..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input 
                type="date" 
                className="date-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <button className="btn-add-order">
                <span className="material-symbols-outlined">add</span>
                New Order
              </button>
            </div>

            {/* Table */}
            <div className="table-container">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading courier orders...</p>
                </div>
              ) : filteredCouriers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <h3>No courier orders found</h3>
                  <p>There are no courier orders to display at the moment.</p>
                </div>
              ) : (
                <table className="courier-table">
                  <thead>
                    <tr>
                      <th>Order Number</th>
                      <th>Sender</th>
                      <th>Recipient</th>
                      <th>Item</th>
                      <th>Date & Time</th>
                      <th>Driver</th>
                      <th>Delivery Fee</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCouriers.map((courier) => (
                      <tr key={courier.id} className="courier-row" onClick={() => handleCourierClick(courier.id)}>
                        <td className="order-number">
                          <div className="order-id">#{courier.orderNumber}</div>
                          <div className="courier-id">{courier.id}</div>
                        </td>
                        <td className="sender-cell">
                          <div className="person-info">
                            <div className="person-name">{courier.sender.name}</div>
                            <div className="person-details">
                              <span className="material-symbols-outlined icon-small">phone</span>
                              {courier.sender.phone}
                            </div>
                            <div className="person-details">
                              <span className="material-symbols-outlined icon-small">location_on</span>
                              {courier.sender.address}
                            </div>
                          </div>
                        </td>
                        <td className="recipient-cell">
                          <div className="person-info">
                            <div className="person-name">{courier.recipient.name}</div>
                            <div className="person-details">
                              <span className="material-symbols-outlined icon-small">phone</span>
                              {courier.recipient.phone}
                            </div>
                            <div className="person-details">
                              <span className="material-symbols-outlined icon-small">location_on</span>
                              {courier.recipient.address}
                            </div>
                          </div>
                        </td>
                        <td className="item-cell">
                          <div className="item-info">
                            <span className="material-symbols-outlined item-icon">inventory_2</span>
                            {courier.item}
                          </div>
                        </td>
                        <td className="datetime-cell">
                          <div className="datetime-info">
                            <div className="date">{courier.date}</div>
                            <div className="time">{courier.time}</div>
                          </div>
                        </td>
                        <td className="driver-cell">
                          {courier.driver ? (
                            <div className="driver-info">
                              <div className="driver-name">{courier.driver.name}</div>
                              <div className="driver-vehicle">{courier.driver.vehicle}</div>
                            </div>
                          ) : (
                            <span className="no-driver">Not Assigned</span>
                          )}
                        </td>
                        <td className="fee-cell">
                          <div className="fee-amount">{courier.deliveryFee}</div>
                        </td>
                        <td>
                          <StatusBadge status={courier.status} />
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button className="action-btn" title="View Details">
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="action-btn" title="Track Order">
                            <span className="material-symbols-outlined">my_location</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

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

