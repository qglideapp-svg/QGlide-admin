import React, { useEffect, useState } from 'react';
import './MapRoute.css';

// Google Maps Route Component

const MapRoute = ({ 
  pickupLocation, 
  dropoffLocation, 
  pickupCoordinates, 
  dropoffCoordinates,
  className = ""
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    try {
      if (pickupCoordinates && dropoffCoordinates) {
        // Parse coordinates from POINT format or array
        const parseCoordinates = (coords) => {
          if (Array.isArray(coords)) {
            return coords;
          }
          if (typeof coords === 'string') {
            // Handle POINT(lng lat) format
            const match = coords.match(/POINT\(([^)]+)\)/);
            if (match) {
              const parts = match[1].trim().split(/\s+/);
              if (parts.length === 2) {
                const lng = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                  return `${lat},${lng}`;  // Google Maps format
                }
              }
            }
            // Handle comma-separated format
            const parts = coords.split(',');
            if (parts.length === 2) {
              const lat = parseFloat(parts[0].trim());
              const lng = parseFloat(parts[1].trim());
              if (!isNaN(lat) && !isNaN(lng)) {
                return `${lat},${lng}`;
              }
            }
          }
          return null;
        };

        const pickup = parseCoordinates(pickupCoordinates);
        const dropoff = parseCoordinates(dropoffCoordinates);

        if (pickup && dropoff) {
          // Generate Google Maps embed URL with directions
          const pickupAddr = encodeURIComponent(pickupLocation || 'Pickup Location');
          const dropoffAddr = encodeURIComponent(dropoffLocation || 'Dropoff Location');
          
          const googleMapsUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgR6R8gJZqY&origin=${pickup}&destination=${dropoff}&mode=driving`;
          
          setMapUrl(googleMapsUrl);
          console.log('Generated Google Maps URL:', googleMapsUrl);
        }
      }
    } catch (error) {
      console.error('Google Maps initialization error:', error);
      setMapError(error.message);
    }
  }, [pickupCoordinates, dropoffCoordinates, pickupLocation, dropoffLocation]);

  // Function to calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Parse coordinates helper function
  const parseCoordinates = (coords) => {
    if (Array.isArray(coords)) {
      return coords;
    }
    if (typeof coords === 'string') {
      // Handle POINT(lng lat) format
      const match = coords.match(/POINT\(([^)]+)\)/);
      if (match) {
        const parts = match[1].trim().split(/\s+/);
        if (parts.length === 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];  // Leaflet needs [lat, lng]
          }
        }
      }
      // Handle comma-separated format
      const parts = coords.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
    }
    return null;
  };

  const pickupCoords = parseCoordinates(pickupCoordinates);
  const dropoffCoords = parseCoordinates(dropoffCoordinates);

  // If there's a map error, show fallback
  if (mapError) {
    return (
      <div className={`map-route-container ${className}`}>
        <div className="map-fallback">
          <div className="fallback-content">
            <h4>🗺️ Route Map</h4>
            <div className="route-visualization">
              <div className="route-line-visual">
                <div className="direction-arrow-visual">➤</div>
              </div>
              <div className="pin pickup-pin-visual">📍</div>
              <div className="pin dropoff-pin-visual">🎯</div>
            </div>
            <div className="fallback-info">
              <p><strong>Pickup:</strong> {pickupLocation || 'Not specified'}</p>
              <p><strong>Dropoff:</strong> {dropoffLocation || 'Not specified'}</p>
            </div>
          </div>
        </div>
        
        {/* Route Summary */}
        <div className="route-summary">
          <div className="route-item">
            <span className="route-icon pickup">📍</span>
            <div>
              <div className="route-label">Pickup</div>
              <div className="route-address">{pickupLocation || 'Pickup location'}</div>
            </div>
          </div>
          <div className="route-line">
            <div className="route-distance">Route</div>
          </div>
          <div className="route-item">
            <span className="route-icon dropoff">🎯</span>
            <div>
              <div className="route-label">Dropoff</div>
              <div className="route-address">{dropoffLocation || 'Dropoff location'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`map-route-container ${className}`}>
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Route Map"
          />
        ) : (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading Google Maps...</p>
          </div>
        )}
      
        {/* Route Summary */}
        <div className="route-summary">
          <div className="route-item">
            <span className="route-icon pickup">📍</span>
            <div>
              <div className="route-label">Pickup</div>
              <div className="route-address">{pickupLocation || 'Pickup location'}</div>
            </div>
          </div>
          <div className="route-line">
            <div className="route-distance">Route</div>
          </div>
          <div className="route-item">
            <span className="route-icon dropoff">🎯</span>
            <div>
              <div className="route-label">Dropoff</div>
              <div className="route-address">{dropoffLocation || 'Dropoff location'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Google Maps rendering error:', error);
    setMapError(error.message);
    // Return the fallback UI
    return (
      <div className={`map-route-container ${className}`}>
        <div className="map-fallback">
          <div className="fallback-content">
            <h4>🗺️ Route Map</h4>
            <div className="route-visualization">
              <div className="route-line-visual">
                <div className="direction-arrow-visual">➤</div>
              </div>
              <div className="pin pickup-pin-visual">📍</div>
              <div className="pin dropoff-pin-visual">🎯</div>
            </div>
            <div className="fallback-info">
              <p><strong>Pickup:</strong> {pickupLocation || 'Not specified'}</p>
              <p><strong>Dropoff:</strong> {dropoffLocation || 'Not specified'}</p>
            </div>
          </div>
        </div>
        
        {/* Route Summary */}
        <div className="route-summary">
          <div className="route-item">
            <span className="route-icon pickup">📍</span>
            <div>
              <div className="route-label">Pickup</div>
              <div className="route-address">{pickupLocation || 'Pickup location'}</div>
            </div>
          </div>
          <div className="route-line">
            <div className="route-distance">Route</div>
          </div>
          <div className="route-item">
            <span className="route-icon dropoff">🎯</span>
            <div>
              <div className="route-label">Dropoff</div>
              <div className="route-address">{dropoffLocation || 'Dropoff location'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MapRoute;
