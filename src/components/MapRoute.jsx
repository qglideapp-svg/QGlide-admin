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
    console.log('🔍 parseCoordinates input:', coords, 'type:', typeof coords);
    
    if (Array.isArray(coords)) {
      console.log('📊 Array format detected:', coords);
      if (coords.length >= 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log('✅ Array parsed successfully:', { lat, lng });
          return { lat, lng };
        }
      }
    }
    
    if (typeof coords === 'string') {
      console.log('📝 String format detected:', coords);
      
      // Handle POINT(lng lat) format
      const pointMatch = coords.match(/POINT\(([^)]+)\)/);
      if (pointMatch) {
        const parts = pointMatch[1].trim().split(/\s+/);
        if (parts.length === 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log('✅ POINT format parsed:', { lat, lng });
            return { lat, lng };
          }
        }
      }
      
      // Handle (lat, lng) format
      const parenMatch = coords.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const parts = parenMatch[1].split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            console.log('✅ Parentheses format parsed:', { lat, lng });
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
          console.log('✅ Comma format parsed:', { lat, lng });
          return { lat, lng };
        }
      }
      
      // Handle space-separated format
      const spaceParts = coords.trim().split(/\s+/);
      if (spaceParts.length === 2) {
        const lat = parseFloat(spaceParts[0]);
        const lng = parseFloat(spaceParts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log('✅ Space format parsed:', { lat, lng });
          return { lat, lng };
        }
      }
    }
    
    console.log('❌ Failed to parse coordinates:', coords);
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
    let retryCount = 0;
    const maxRetries = 50; // Maximum 5 seconds (50 * 100ms)
    
    const initializeGoogleMap = () => {
      try {
        if (!isMounted) return;
        
        if (!window.google || !window.google.maps) {
          setMapError('Google Maps API not loaded');
          setIsLoading(false);
          return;
        }
        
        // Check if mapRef.current exists
        if (!mapRef.current) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.log('❌ Map ref not ready after maximum retries, using fallback');
            setMapError('Map container not available');
            setIsLoading(false);
            return;
          }
          console.log(`❌ Map ref not ready, retrying in 100ms... (attempt ${retryCount}/${maxRetries})`);
          setTimeout(initializeGoogleMap, 100);
          return;
        }
        
        console.log('✅ Map ref is ready, initializing Google Maps...');

        console.log('🔍 Parsing coordinates:', { pickupCoordinates, dropoffCoordinates });
        
        const pickup = parseCoordinates(pickupCoordinates);
        const dropoff = parseCoordinates(dropoffCoordinates);
        
        console.log('📍 Parsed coordinates:', { pickup, dropoff });

        if (!pickup || !dropoff) {
          console.log('❌ Invalid coordinates - using fallback');
          // Use fallback coordinates for testing
          const fallbackPickup = { lat: 25.2769, lng: 51.5007 }; // Doha center
          const fallbackDropoff = { lat: 25.2611, lng: 51.6094 }; // Airport area
          
          const centerLat = (fallbackPickup.lat + fallbackDropoff.lat) / 2;
          const centerLng = (fallbackPickup.lng + fallbackDropoff.lng) / 2;
          
          console.log('🔄 Using fallback coordinates:', { fallbackPickup, fallbackDropoff });
          
          // Initialize map with fallback coordinates
          if (!mapRef.current) {
            console.log('❌ Map ref not ready for fallback, retrying...');
            setTimeout(() => initializeGoogleMap(), 100);
            return;
          }
          
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: 12,
            mapTypeId: 'roadmap'
          });
          
          // Add fallback markers
          new window.google.maps.Marker({
            position: fallbackPickup,
            map: map,
            title: 'Pickup Location (Fallback)',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#22bc44',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
          
          new window.google.maps.Marker({
            position: fallbackDropoff,
            map: map,
            title: 'Dropoff Location (Fallback)',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#df4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
          
          setIsLoading(false);
          setMapError(null);
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
        if (!mapRef.current) {
          console.log('❌ Map ref not ready for main map, retrying...');
          setTimeout(() => initializeGoogleMap(), 100);
          return;
        }
        
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
      // Add a small delay to ensure component is fully mounted
      setTimeout(() => {
        if (isMounted) {
          initializeGoogleMap();
        }
      }, 200);
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [pickupCoordinates, dropoffCoordinates, pickupLocation, dropoffLocation]);

  // Additional useEffect to ensure DOM element is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current && isLoading) {
        console.log('🔄 DOM element ready, re-triggering map initialization...');
        // Re-trigger the map initialization if still loading
        if (window.google && window.google.maps) {
          const event = new Event('googleMapsReady');
          window.dispatchEvent(event);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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