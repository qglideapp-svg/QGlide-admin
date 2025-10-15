import React, { useEffect, useState, useRef } from 'react';
import './MapRoute.css';

const MapRoute = ({ 
  pickupLocation, 
  dropoffLocation, 
  pickupCoordinates, 
  dropoffCoordinates,
  className = ""
}) => {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
            return { lat, lng };
          }
        }
      }
      // Handle comma-separated format
      const parts = coords.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    return null;
  };

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

  useEffect(() => {
    let isMounted = true;
    
    const initializeGoogleMap = () => {
      try {
        if (!isMounted) return;
        
        if (!window.google || !window.google.maps) {
          setMapError('Google Maps API not loaded');
          setIsLoading(false);
          return;
        }

        const pickup = parseCoordinates(pickupCoordinates);
        const dropoff = parseCoordinates(dropoffCoordinates);

        if (!pickup || !dropoff) {
          setMapError('Invalid coordinates provided');
          setIsLoading(false);
          return;
        }

        // Calculate center point
        const centerLat = (pickup.lat + dropoff.lat) / 2;
        const centerLng = (pickup.lng + dropoff.lng) / 2;

        // Calculate appropriate zoom level based on distance
        const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        let zoom = 12;
        if (distance > 50) {
          zoom = 10;
        } else if (distance > 20) {
          zoom = 11;
        } else {
          zoom = 13;
        }

        // Initialize map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: zoom,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        // Create pickup marker
        const pickupMarker = new window.google.maps.Marker({
          position: pickup,
          map: map,
          title: 'Pickup Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#22bc44',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          label: {
            text: 'P',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Create dropoff marker
        const dropoffMarker = new window.google.maps.Marker({
          position: dropoff,
          map: map,
          title: 'Dropoff Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#df4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          label: {
            text: 'D',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Create info windows
        const pickupInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 4px 0; color: #22bc44;">📍 Pickup Location</h4>
              <p style="margin: 0; font-size: 14px;">${pickupLocation || 'Pickup location'}</p>
            </div>
          `
        });

        const dropoffInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 4px 0; color: #df4444;">🎯 Dropoff Location</h4>
              <p style="margin: 0; font-size: 14px;">${dropoffLocation || 'Dropoff location'}</p>
            </div>
          `
        });

        // Add click listeners to markers
        pickupMarker.addListener('click', () => {
          pickupInfoWindow.open(map, pickupMarker);
        });

        dropoffMarker.addListener('click', () => {
          dropoffInfoWindow.open(map, dropoffMarker);
        });

        // Draw route line with directional arrow
        const routePath = new window.google.maps.Polyline({
          path: [pickup, dropoff],
          geodesic: true,
          strokeColor: '#22bc44',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          icons: [
            {
              icon: {
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                fillColor: '#df4444',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1
              },
              offset: '50%',
              repeat: '0px'
            }
          ]
        });

        routePath.setMap(map);

        // Create distance info window using the already calculated distance
        const distanceInfoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; text-align: center;">
              <h4 style="margin: 0 0 4px 0; color: #333;">📏 Route Distance</h4>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #22bc44;">${distance.toFixed(2)} km</p>
            </div>
          `,
          position: { lat: centerLat, lng: centerLng }
        });

        // Show distance info after a short delay
        setTimeout(() => {
          distanceInfoWindow.open(map);
        }, 1000);

        setIsLoading(false);
        setMapError(null);

      } catch (error) {
        console.error('Google Maps initialization error:', error);
        setMapError(error.message);
        setIsLoading(false);
      }
    };

    // Load Google Maps API if not already loaded
    if (!window.google || !window.google.maps) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script already exists, just wait for it to load
        existingScript.onload = initializeGoogleMap;
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBrThzOJlW4SbyUHKLoCrv9yK5AAs_esao&libraries=geometry&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleMap;
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializeGoogleMap();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [pickupCoordinates, dropoffCoordinates, pickupLocation, dropoffLocation]);

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
              <p style={{color: '#df4444', marginTop: '10px'}}><strong>Error:</strong> {mapError}</p>
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

  // Show loading state
  if (isLoading) {
    return (
      <div className={`map-route-container ${className}`}>
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Main Google Maps render
  return (
    <div className={`map-route-container ${className}`}>
      <div 
        ref={mapRef} 
        className="google-map-container"
        style={{ width: '100%', height: '400px' }}
      />
      
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
};

export default MapRoute;