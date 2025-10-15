import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './RideDetailsView.css';
import { fetchRideDetails } from '../services/ridesService';
import Toast from '../components/Toast';
import MapRoute from '../components/MapRoute';
import logo from '../assets/images/logo.webp';
import settingsIcon from '../assets/icons/settings.png';
import notificationsIcon from '../assets/icons/notifications.png';
import { logoutUser } from '../services/authService';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function RideDetailsView() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [rideData, setRideData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Transform API response to match expected data structure
  const transformRideData = (apiData) => {
    if (!apiData) return null;

    return {
      id: apiData.id,
      status: apiData.status,
      // Handle route data
      pickupLocation: apiData.route?.pickup_address || apiData.pickupLocation || 'The Pearl-Qatar, Doha',
      dropoffLocation: apiData.route?.dropoff_address || apiData.dropoffLocation || 'Hamad International Airport',
      pickup_location: apiData.route?.pickup_location || apiData.pickup_location || 'POINT(51.5403 25.3675)', // The Pearl coordinates
      dropoff_location: apiData.route?.dropoff_location || apiData.dropoff_location || 'POINT(51.6094 25.2611)', // Airport coordinates
      
      // Handle rider data
      rider: {
        name: apiData.rider?.name || 'Unknown Rider',
        phone: apiData.rider?.phone || 'N/A',
        avatar: apiData.rider?.avatar_url || apiData.rider?.avatar || 'https://i.pravatar.cc/40?img=1',
        rating: apiData.rider?.rating || 0,
        totalRides: apiData.rider?.total_rides || 0
      },
      
      // Handle driver data
      driver: {
        name: apiData.driver?.name || 'Unknown Driver',
        rating: apiData.driver?.rating || 0,
        totalRides: apiData.driver?.total_rides || 0,
        avatar: apiData.driver?.avatar_url || apiData.driver?.avatar || 'https://i.pravatar.cc/40?img=2',
        vehicle: apiData.driver?.vehicle || 'N/A',
        licensePlate: apiData.driver?.license_plate || 'N/A'
      },
      
      // Handle fare details
      fare: {
        base: apiData.fare_details?.base_fare || 0,
        distance: apiData.fare_details?.distance_fare || 0,
        distanceKm: apiData.fare_details?.distance_km || 0,
        time: apiData.fare_details?.time_fare || 0,
        timeMinutes: apiData.fare_details?.time_minutes || 0,
        airportSurcharge: apiData.fare_details?.airport_surcharge || 0,
        promoCode: apiData.fare_details?.promo_code ? {
          code: apiData.fare_details.promo_code,
          discount: apiData.fare_details.promo_discount || 0
        } : null,
        total: apiData.fare_details?.total_fare || 0
      },
      
      // Handle payment data
      payment: {
        amount: apiData.payment?.amount || 0,
        currency: apiData.payment?.currency || 'USD',
        status: apiData.payment?.status || 'pending',
        method: apiData.payment?.payment_method || 'credit_card',
        transactionId: apiData.payment?.transaction_id || 'N/A',
        processedAt: apiData.payment?.processed_at || null
      },
      
      // Handle timeline data
      timeline: {
        requestedAt: apiData.timeline?.requested_at || null,
        acceptedAt: apiData.timeline?.accepted_at || null,
        startedAt: apiData.timeline?.started_at || null,
        completedAt: apiData.timeline?.completed_at || null
      }
    };
  };
  
  useEffect(() => {
    if (rideId) {
      loadRideDetails();
    }
  }, [rideId]);

  const loadRideDetails = async () => {
    console.log('🚀 Loading ride details for ID:', rideId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchRideDetails(rideId);
      console.log('📡 Ride details API result:', result);
      
      if (result.success) {
        console.log('✅ API Response:', result.data);
        console.log('📊 API Response keys:', Object.keys(result.data || {}));
        
        // Handle nested data structure like we did for rides list
        let rideDetailsData = null;
        if (result.data && result.data.data && result.data.data.ride) {
          rideDetailsData = result.data.data.ride;
          console.log('📋 Data found in .data.ride property:', rideDetailsData);
        } else if (result.data && result.data.data) {
          rideDetailsData = result.data.data;
          console.log('📋 Data found in .data property:', rideDetailsData);
        } else if (result.data) {
          rideDetailsData = result.data;
          console.log('📋 Data is direct object:', rideDetailsData);
        } else {
          console.log('⚠️ No ride details found in response');
          console.log('🔍 Full response structure:', JSON.stringify(result, null, 2));
        }
        
        console.log('🎯 Final processed ride details:', rideDetailsData);
        console.log('🔍 Ride details keys:', Object.keys(rideDetailsData || {}));
        
        // Transform the API response to match the expected data structure
        const transformedData = transformRideData(rideDetailsData);
        console.log('🔄 Transformed ride data:', transformedData);
        setRideData(transformedData);
      } else {
        console.log('❌ API error:', result.error);
        setError(result.error);
        setShowToast(true);
        // Show fallback data for debugging
        setRideData({
          id: rideId,
          status: 'Completed',
          pickupLocation: 'The Pearl-Qatar, Doha',
          dropoffLocation: 'Hamad International Airport',
          rider: {
            name: 'John Doe',
            phone: '(123) 456-7890',
            avatar: 'https://i.pravatar.cc/40?img=1',
            rating: 4.8,
            totalRides: 25
          },
          driver: {
            name: 'John Driver',
            avatar: 'https://i.pravatar.cc/40?img=2',
            rating: 4.9,
            totalRides: 150,
            vehicle: 'Toyota Camry',
            licensePlate: 'ABC123'
          },
          fare: {
            base: 10.00,
            distance: 36.40,
            distanceKm: 18.2,
            time: 12.50,
            timeMinutes: 25,
            airportSurcharge: 5.00,
            promoCode: {
              code: 'QATAR2025',
              discount: 10.00
            },
            total: 53.90
          },
          payment: {
            method: 'Visa',
            lastFour: '4242'
          },
          timeline: {
            completed: '2025-10-07T14:34:00'
          }
        });
      }
    } catch (err) {
      console.log('💥 Load ride details error:', err);
      setError('Failed to load ride details');
      setShowToast(true);
      // Show fallback data for debugging
      setRideData({
        id: rideId,
        status: 'Completed',
        pickupLocation: 'The Pearl-Qatar, Doha',
        dropoffLocation: 'Hamad International Airport',
        rider: {
          name: 'John Doe',
          phone: '(123) 456-7890',
          avatar: 'https://i.pravatar.cc/40?img=1',
          rating: 4.8,
          totalRides: 25
        },
        driver: {
          name: 'John Driver',
          avatar: 'https://i.pravatar.cc/40?img=2',
          rating: 4.9,
          totalRides: 150,
          vehicle: 'Toyota Camry',
          licensePlate: 'ABC123'
        },
        fare: {
          base: 10.00,
          distance: 36.40,
          distanceKm: 18.2,
          time: 12.50,
          timeMinutes: 25,
          airportSurcharge: 5.00,
          promoCode: {
            code: 'QATAR2025',
            discount: 10.00
          },
          total: 53.90
        },
        payment: {
          method: 'Visa',
          lastFour: '4242'
        },
        timeline: {
          completed: '2025-10-07T14:34:00'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeToast = () => {
    setShowToast(false);
    setError(null);
  };

  // Fallback data structure for when API data is not available
  const defaultRideData = {
    id: rideId || 'QG-8D3F7B1C',
    status: 'Completed',
    pickupLocation: 'The Pearl-Qatar, Doha',
    dropoffLocation: 'Hamad International Airport',
    rider: {
      name: 'Jassim Al-Kuwari',
      avatar: 'https://i.pravatar.cc/80?img=4',
      rating: 4.92,
      totalRides: 128
    },
    driver: {
      name: 'Farhan Khan',
      avatar: 'https://i.pravatar.cc/80?img=6',
      rating: 4.88,
      totalRides: 512,
      vehicle: 'Toyota Camry (2023)',
      licensePlate: '654321'
    },
    fare: {
      base: 10.00,
      distance: 36.40,
      distanceKm: 18.2,
      time: 12.50,
      timeMinutes: 25,
      airportSurcharge: 5.00,
      promoCode: {
        code: 'QATAR2025',
        discount: 10.00
      },
      total: 53.90
    },
    payment: {
      method: 'Visa',
      lastFour: '4242'
    },
    timeline: {
      completed: '2025-10-07T14:34:00'
    }
  };

  // Use API data if available, otherwise fallback to default
  const currentRideData = rideData || defaultRideData;
  
  // Add safety check for rideData structure
  if (!currentRideData) {
    console.error('❌ No ride data available');
    return (
      <div style={{ padding: '20px', fontFamily: 'Poppins' }}>
        <h1>Error: No ride data available</h1>
        <button onClick={() => navigate('/ride-management')}>Back to Rides</button>
      </div>
    );
  }

  // Debug mode - show component state when loading fails
  if (process.env.NODE_ENV === 'development' && !rideData && !isLoading && !error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Poppins', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>🚗 Ride Details - Debug Mode</h1>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>Component State:</h3>
          <p><strong>Ride ID:</strong> {rideId}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>Ride Data:</strong> {rideData ? 'Loaded' : 'Not loaded'}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
          <button 
            onClick={() => loadRideDetails()} 
            style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
          >
            Retry Load Details
          </button>
        </div>
      </div>
    );
  }

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

  const handleBackToRides = () => {
    navigate('/ride-management');
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateFormatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
    return `${time}, ${dateFormatted}`;
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'active': return 'status-active';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Wrap the entire render in try-catch for error handling
  try {
    return (
      <div className="ride-details grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" active={true} onClick={() => handleNavClick('ride-management')} />
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

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>Ride Details</h1>
            <p className="sub">Ride ID: {currentRideData.id || 'Unknown'}</p>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search..." />
            </div>
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
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading ride details...</p>
            </div>
          ) : (
            <>
              {/* Back Link and Status */}
              <div className="ride-header">
            <button className="back-link" onClick={handleBackToRides}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back to All Rides
            </button>
            <div className="status-actions">
              <span className={`status-badge ${getStatusClass(currentRideData.status)}`}>{currentRideData.status || 'Unknown'}</span>
              <div className="action-buttons">
                <button className="btn-cancel">Cancel Ride</button>
                <button className="btn-reassign">Reassign Driver</button>
              </div>
            </div>
          </div>

          <div className="ride-content">
            {/* Left Column - Main Content */}
            <div className="main-content">
              {/* Ride Route */}
              <div className="section">
                <h3>Ride Route</h3>
                <div className="map-container">
                  <MapRoute 
                    pickupLocation={currentRideData.pickupLocation || currentRideData.pickup_location}
                    dropoffLocation={currentRideData.dropoffLocation || currentRideData.dropoff_location}
                    pickupCoordinates={currentRideData.pickup_location}
                    dropoffCoordinates={currentRideData.dropoff_location}
                    className="ride-map"
                  />
                </div>
                <div className="location-details">
                  <div className="location-item">
                    <span className="location-icon pickup-icon">📍</span>
                    <div>
                      <div className="location-label-text">Pickup Location:</div>
                      <div className="location-address">{currentRideData.pickupLocation || currentRideData.pickup_location || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="location-item">
                    <span className="location-icon dropoff-icon">🎯</span>
                    <div>
                      <div className="location-label-text">Dropoff Location:</div>
                      <div className="location-address">{currentRideData.dropoffLocation || currentRideData.dropoff_location || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Details */}
              <div className="section fare-details-section">
                <h3>Fare Details</h3>
                <div className="fare-breakdown">
                  <div className="fare-item">
                    <span>Base Fare</span>
                    <span>QAR {currentRideData.fare?.base?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="fare-item">
                    <span>Distance ({currentRideData.fare?.distanceKm || 0} km)</span>
                    <span>QAR {currentRideData.fare?.distance?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="fare-item">
                    <span>Time ({currentRideData.fare?.timeMinutes || 0} min)</span>
                    <span>QAR {currentRideData.fare?.time?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="fare-item">
                    <span>Airport Surcharge</span>
                    <span>QAR {currentRideData.fare?.airportSurcharge?.toFixed(2) || '0.00'}</span>
                  </div>
                  {currentRideData.fare?.promoCode && (
                    <div className="fare-item promo-code">
                      <span>Promo Code ({currentRideData.fare.promoCode.code})</span>
                      <span>- QAR {currentRideData.fare.promoCode.discount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  
                  <div className="fare-separator"></div>
                  
                  <div className="fare-item total-fare">
                    <span>Total Fare</span>
                    <span className="total-amount">QAR {currentRideData.fare?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="payment-section">
                    <div className="payment-method">
                      <div className="visa-logo">VISA</div>
                      <div className="payment-info">
                        <div className="payment-text">Paid with Visa</div>
                        <div className="card-number">**** **** **** {currentRideData.payment?.lastFour || '0000'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Side Info */}
            <div className="side-content">
              {/* Rider Information */}
              <div className="section">
                <h3>Rider Information</h3>
                <div className="user-card">
                  <img src={currentRideData.rider?.avatar || currentRideData.rider?.avatar_url || 'https://i.pravatar.cc/40?img=1'} alt={currentRideData.rider?.name || 'Unknown'} className="user-avatar" />
                  <div className="user-details">
                    <div className="user-name">{currentRideData.rider?.name || 'Unknown Rider'}</div>
                    <div className="user-rating">
                      ★ {currentRideData.rider?.rating || '0.0'} ({currentRideData.rider?.totalRides || 0} rides)
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="section">
                <h3>Driver Information</h3>
                <div className="user-card">
                  <img src={currentRideData.driver?.avatar || currentRideData.driver?.avatar_url || 'https://i.pravatar.cc/40?img=2'} alt={currentRideData.driver?.name || 'Unknown'} className="user-avatar" />
                  <div className="user-details">
                    <div className="user-name">{currentRideData.driver?.name || 'Unknown Driver'}</div>
                    <div className="user-rating">
                      ★ {currentRideData.driver?.rating || '0.0'} ({currentRideData.driver?.totalRides || 0} rides)
                    </div>
                    <div className="vehicle-info">
                      <div>Vehicle: {currentRideData.driver?.vehicle || 'Not specified'}</div>
                      <div>License Plate: {currentRideData.driver?.licensePlate || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ride Timeline */}
              <div className="section">
                <h3>Ride Timeline</h3>
                <div className="timeline">
                  {currentRideData.timeline?.requestedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-icon">📱</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Ride Requested</div>
                        <div className="timeline-time">{formatDateTime(currentRideData.timeline.requestedAt)}</div>
                      </div>
                    </div>
                  )}
                  {currentRideData.timeline?.acceptedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-icon">✅</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Ride Accepted</div>
                        <div className="timeline-time">{formatDateTime(currentRideData.timeline.acceptedAt)}</div>
                      </div>
                    </div>
                  )}
                  {currentRideData.timeline?.startedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-icon">🚗</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Ride Started</div>
                        <div className="timeline-time">{formatDateTime(currentRideData.timeline.startedAt)}</div>
                      </div>
                    </div>
                  )}
                  {currentRideData.timeline?.completedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-icon">🏁</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Ride Completed</div>
                        <div className="timeline-time">{formatDateTime(currentRideData.timeline.completedAt)}</div>
                      </div>
                    </div>
                  )}
                  {!currentRideData.timeline?.requestedAt && !currentRideData.timeline?.completedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-icon">🏁</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Ride Completed</div>
                        <div className="timeline-time">{formatDateTime(currentRideData.timeline?.completed || currentRideData.created_at || new Date().toISOString())}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
      
      {showToast && (
        <Toast 
          message={error || 'Failed to load ride details'} 
          type="error" 
          onClose={closeToast}
        />
      )}
    </div>
    );
  } catch (renderError) {
    console.error('💥 Render error in RideDetailsView:', renderError);
    return (
      <div style={{ padding: '20px', fontFamily: 'Poppins', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>🚗 Ride Details - Error</h1>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h3>Render Error:</h3>
          <p><strong>Error:</strong> {renderError.message}</p>
          <p><strong>Ride ID:</strong> {rideId}</p>
          <p><strong>Ride Data:</strong> {JSON.stringify(rideData, null, 2)}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/ride-management')}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Back to Rides
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
