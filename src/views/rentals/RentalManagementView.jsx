import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RentalManagementView.css';
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
    if (!status) return 'rental-status-pending';
    switch (status.toLowerCase()) {
      case 'active': 
      case 'rented': return 'rental-status-active';
      case 'available': return 'rental-status-available';
      case 'maintenance': return 'rental-status-maintenance';
      case 'reserved': return 'rental-status-reserved';
      case 'completed': return 'rental-status-completed';
      case 'cancelled': return 'rental-status-cancelled';
      default: return 'rental-status-pending';
    }
  };

  return <span className={`rental-status-badge ${getStatusClass(status)}`}>{status || 'pending'}</span>;
};

const VehicleTypeBadge = ({ type }) => {
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'suv': return { bg: '#dbeafe', color: '#1e40af' };
      case 'sedan': return { bg: '#e0e7ff', color: '#4f46e5' };
      case 'luxury': return { bg: '#fef3c7', color: '#92400e' };
      case 'economy': return { bg: '#d1fae5', color: '#065f46' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const colors = getTypeColor(type);
  return (
    <span 
      className="vehicle-type-badge" 
      style={{ background: colors.bg, color: colors.color }}
    >
      {type || 'N/A'}
    </span>
  );
};

export default function RentalManagementView() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [rentals, setRentals] = useState([]);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalVehicles: 0,
    available: 0,
    activeRentals: 0,
    inMaintenance: 0
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Mock data for now - replace with API call
  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockRentals = [
        {
          id: 'RNT-001',
          bookingNumber: 'BK-2025-001',
          customer: { 
            name: 'Ahmed Al-Kuwari', 
            phone: '+974 55123456', 
            email: 'ahmed@example.com',
            avatar: 'https://i.pravatar.cc/40?img=15'
          },
          vehicle: { 
            model: 'Toyota Camry 2024', 
            type: 'Sedan',
            plateNumber: 'QAT 1234',
            color: 'White',
            image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=200&fit=crop'
          },
          rentalPeriod: {
            startDate: '2025-10-08',
            startTime: '09:00 AM',
            endDate: '2025-10-12',
            endTime: '06:00 PM',
            duration: '4 days'
          },
          pricing: {
            dailyRate: 'QAR 150',
            totalAmount: 'QAR 600',
            deposit: 'QAR 500',
            status: 'Paid'
          },
          status: 'active',
          pickupLocation: 'Hamad International Airport',
          returnLocation: 'Same Location',
          driver: null
        },
        {
          id: 'RNT-002',
          bookingNumber: 'BK-2025-002',
          customer: { 
            name: 'Fatima Al-Marri', 
            phone: '+974 55987654', 
            email: 'fatima@example.com',
            avatar: 'https://i.pravatar.cc/40?img=20'
          },
          vehicle: { 
            model: 'Range Rover Sport 2024', 
            type: 'SUV',
            plateNumber: 'QAT 5678',
            color: 'Black',
            image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=300&h=200&fit=crop'
          },
          rentalPeriod: {
            startDate: '2025-10-10',
            startTime: '10:00 AM',
            endDate: '2025-10-15',
            endTime: '08:00 PM',
            duration: '5 days'
          },
          pricing: {
            dailyRate: 'QAR 350',
            totalAmount: 'QAR 1,750',
            deposit: 'QAR 1,000',
            status: 'Pending'
          },
          status: 'reserved',
          pickupLocation: 'The Pearl-Qatar',
          returnLocation: 'Hamad International Airport',
          driver: { name: 'Yusuf Ahmed', phone: '+974 55432100' }
        },
        {
          id: 'RNT-003',
          bookingNumber: 'BK-2025-003',
          customer: { 
            name: 'Omar Hassan', 
            phone: '+974 55345678', 
            email: 'omar@example.com',
            avatar: 'https://i.pravatar.cc/40?img=12'
          },
          vehicle: { 
            model: 'Mercedes-Benz E-Class 2023', 
            type: 'Luxury',
            plateNumber: 'QAT 9012',
            color: 'Silver',
            image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&h=200&fit=crop'
          },
          rentalPeriod: {
            startDate: '2025-10-05',
            startTime: '08:00 AM',
            endDate: '2025-10-07',
            endTime: '10:00 PM',
            duration: '2 days'
          },
          pricing: {
            dailyRate: 'QAR 280',
            totalAmount: 'QAR 560',
            deposit: 'QAR 800',
            status: 'Paid'
          },
          status: 'completed',
          pickupLocation: 'West Bay, Doha',
          returnLocation: 'Same Location',
          driver: { name: 'Ali Khan', phone: '+974 55678901' }
        },
        {
          id: 'RNT-004',
          bookingNumber: 'BK-2025-004',
          vehicle: { 
            model: 'Nissan Altima 2024', 
            type: 'Economy',
            plateNumber: 'QAT 3456',
            color: 'Blue',
            image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=300&h=200&fit=crop'
          },
          status: 'available',
          pricing: {
            dailyRate: 'QAR 120',
            deposit: 'QAR 300'
          }
        },
        {
          id: 'RNT-005',
          bookingNumber: 'BK-2025-005',
          vehicle: { 
            model: 'BMW X5 2024', 
            type: 'SUV',
            plateNumber: 'QAT 7890',
            color: 'White',
            image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=300&h=200&fit=crop'
          },
          status: 'maintenance',
          pricing: {
            dailyRate: 'QAR 400',
            deposit: 'QAR 1,200'
          }
        }
      ];
      
      setRentals(mockRentals);
      setStats({
        totalVehicles: mockRentals.length,
        available: mockRentals.filter(r => r.status === 'available').length,
        activeRentals: mockRentals.filter(r => r.status === 'active' || r.status === 'rented').length,
        inMaintenance: mockRentals.filter(r => r.status === 'maintenance').length
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
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
    }
  };

  const handleRentalClick = (rentalId) => {
    // Navigate to rental details
    console.log('View rental details:', rentalId);
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

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.bookingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.vehicle?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || rental.status === statusFilter.toLowerCase();
    const matchesType = vehicleTypeFilter === 'All' || rental.vehicle?.type?.toLowerCase() === vehicleTypeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className={`rental-management grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
          <NavItem icon="payments" label="Withdrawals" onClick={() => handleNavClick('withdrawals')} />
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
              <h1>Rental Management</h1>
              <p className="sub">Manage vehicle rentals, bookings, and fleet availability.</p>
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
                <span className="material-symbols-outlined">directions_car</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Vehicles</div>
                <div className="stat-value">{stats.totalVehicles}</div>
              </div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-icon">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Available</div>
                <div className="stat-value">{stats.available}</div>
              </div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <span className="material-symbols-outlined">car_rental</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">Active Rentals</div>
                <div className="stat-value">{stats.activeRentals}</div>
              </div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-icon">
                <span className="material-symbols-outlined">build</span>
              </div>
              <div className="stat-content">
                <div className="stat-label">In Maintenance</div>
                <div className="stat-value">{stats.inMaintenance}</div>
              </div>
            </div>
          </div>

          {/* Filters and Management Card */}
          <div className="rental-management-card">
            <div className="filters-section">
              <div className="search-input">
                <span className="material-symbols-outlined">search</span>
                <input 
                  type="text" 
                  placeholder="Search by booking number, customer, vehicle model, or plate number..." 
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
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="maintenance">Maintenance</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select 
                className="filter-select"
                value={vehicleTypeFilter}
                onChange={(e) => setVehicleTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="luxury">Luxury</option>
                <option value="economy">Economy</option>
              </select>
              <button className="btn-add-rental">
                <span className="material-symbols-outlined">add</span>
                New Booking
              </button>
            </div>

            {/* Table */}
            <div className="table-container">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading rentals...</p>
                </div>
              ) : filteredRentals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <span className="material-symbols-outlined">car_rental</span>
                  </div>
                  <h3>No rentals found</h3>
                  <p>There are no rentals to display at the moment.</p>
                </div>
              ) : (
                <table className="rental-table">
                  <thead>
                    <tr>
                      <th>Booking Details</th>
                      <th>Vehicle</th>
                      <th>Customer</th>
                      <th>Rental Period</th>
                      <th>Pricing</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRentals.map((rental) => (
                      <tr key={rental.id} className="rental-row" onClick={() => handleRentalClick(rental.id)}>
                        <td className="booking-cell">
                          <div className="booking-number">#{rental.bookingNumber || 'N/A'}</div>
                          <div className="rental-id">{rental.id}</div>
                        </td>
                        <td className="vehicle-cell">
                          {rental.vehicle ? (
                            <div className="vehicle-details">
                              <div className="vehicle-image-wrapper">
                                <img 
                                  src={rental.vehicle.image || 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=300&h=200&fit=crop'} 
                                  alt={rental.vehicle.model}
                                  className="vehicle-image"
                                />
                              </div>
                              <div className="vehicle-info">
                                <div className="vehicle-model">{rental.vehicle.model}</div>
                                <div className="vehicle-meta">
                                  <span className="vehicle-plate">{rental.vehicle.plateNumber}</span>
                                  <VehicleTypeBadge type={rental.vehicle.type} />
                                </div>
                                <div className="vehicle-color">
                                  <span className="material-symbols-outlined icon-small">palette</span>
                                  {rental.vehicle.color}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="no-vehicle">No vehicle assigned</span>
                          )}
                        </td>
                        <td className="customer-cell">
                          {rental.customer ? (
                            <div className="customer-info">
                              <img 
                                src={rental.customer.avatar || 'https://i.pravatar.cc/40?img=1'} 
                                alt={rental.customer.name}
                                className="customer-avatar"
                              />
                              <div className="customer-details">
                                <div className="customer-name">{rental.customer.name}</div>
                                <div className="customer-contact">
                                  <span className="material-symbols-outlined icon-small">phone</span>
                                  {rental.customer.phone}
                                </div>
                                <div className="customer-contact">
                                  <span className="material-symbols-outlined icon-small">mail</span>
                                  {rental.customer.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="no-customer">Available Vehicle</span>
                          )}
                        </td>
                        <td className="period-cell">
                          {rental.rentalPeriod ? (
                            <div className="period-info">
                              <div className="period-row">
                                <span className="period-icon">📅</span>
                                <div className="period-content">
                                  <div className="period-main">{rental.rentalPeriod.startDate}</div>
                                  <div className="period-sub">{rental.rentalPeriod.startTime}</div>
                                </div>
                              </div>
                              <div className="period-row">
                                <span className="period-icon">🏁</span>
                                <div className="period-content">
                                  <div className="period-main">{rental.rentalPeriod.endDate}</div>
                                  <div className="period-sub">{rental.rentalPeriod.endTime}</div>
                                </div>
                              </div>
                              <div className="period-duration">
                                <span className="material-symbols-outlined icon-small">schedule</span>
                                <span>{rental.rentalPeriod.duration}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="no-period">N/A</span>
                          )}
                        </td>
                        <td className="pricing-cell">
                          {rental.pricing ? (
                            <div className="pricing-info">
                              {rental.pricing.totalAmount && (
                                <div className="pricing-main">
                                  <span className="pricing-amount">{rental.pricing.totalAmount}</span>
                                </div>
                              )}
                              <div className="pricing-details">
                                <div className="pricing-row">
                                  <span className="pricing-label">Daily:</span>
                                  <span className="pricing-value">{rental.pricing.dailyRate}</span>
                                </div>
                                {rental.pricing.deposit && (
                                  <div className="pricing-row">
                                    <span className="pricing-label">Deposit:</span>
                                    <span className="pricing-value">{rental.pricing.deposit}</span>
                                  </div>
                                )}
                              </div>
                              {rental.pricing.status && (
                                <div className={`pricing-status ${rental.pricing.status.toLowerCase()}`}>
                                  {rental.pricing.status}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="no-pricing">N/A</span>
                          )}
                        </td>
                        <td className="location-cell">
                          {rental.pickupLocation ? (
                            <div className="location-info">
                              <div className="location-item">
                                <span className="material-symbols-outlined icon-small">flight_takeoff</span>
                                <span className="location-text">{rental.pickupLocation}</span>
                              </div>
                              {rental.returnLocation && (
                                <div className="location-item">
                                  <span className="material-symbols-outlined icon-small">flight_land</span>
                                  <span className="location-text">{rental.returnLocation}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="no-location">N/A</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={rental.status} />
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          <div className="actions">
                            <button className="action-btn" title="View Details">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            {rental.status === 'active' && (
                              <button className="action-btn" title="Track Vehicle">
                                <span className="material-symbols-outlined">my_location</span>
                              </button>
                            )}
                            {rental.status === 'available' && (
                              <button className="action-btn" title="Edit Vehicle">
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                            )}
                          </div>
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

