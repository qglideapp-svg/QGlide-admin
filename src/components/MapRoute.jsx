import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapRoute.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNSA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEwIiBmaWxsPSIjMjJiYzQ0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTEyLjUgMjIuNUwxMi41IDQwIiBzdHJva2U9IiMyMmJjNDQiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIxMi41IiB5PSIxMCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iOCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [25, 40],
  iconAnchor: [12, 40],
  popupAnchor: [0, -40],
});

const dropoffIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNSA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEwIiBmaWxsPSIjZGY0NDQ0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTEyLjUgMjIuNUwxMi41IDQwIiBzdHJva2U9IiNkZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIxMi41IiB5PSIxMCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iOCIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EPC90ZXh0Pgo8L3N2Zz4K',
  iconSize: [25, 40],
  iconAnchor: [12, 40],
  popupAnchor: [0, -40],
});

const MapRoute = ({ 
  pickupLocation, 
  dropoffLocation, 
  pickupCoordinates, 
  dropoffCoordinates,
  className = ""
}) => {
  const [center, setCenter] = useState([25.2769, 51.5007]); // Default to Doha
  const [zoom, setZoom] = useState(12);
  const [routeLine, setRouteLine] = useState([]);
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
              console.log('Parsed POINT coordinates:', { lng, lat, original: coords });
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
            console.log('Parsed comma-separated coordinates:', { lat, lng, original: coords });
            if (!isNaN(lat) && !isNaN(lng)) {
              return [lat, lng];
            }
          }
        }
        console.warn('Could not parse coordinates:', coords);
        return null;
      };

      const pickup = parseCoordinates(pickupCoordinates);
      const dropoff = parseCoordinates(dropoffCoordinates);

      if (pickup && dropoff) {
        // Calculate center point
        const centerLat = (pickup[0] + dropoff[0]) / 2;
        const centerLng = (pickup[1] + dropoff[1]) / 2;
        setCenter([centerLat, centerLng]);

        // Set route line
        setRouteLine([pickup, dropoff]);

        // Calculate appropriate zoom level based on distance
        const distance = calculateDistance(pickup[0], pickup[1], dropoff[0], dropoff[1]);
        if (distance > 50) {
          setZoom(10);
        } else if (distance > 20) {
          setZoom(11);
        } else {
          setZoom(13);
        }
      }
    } else if (pickupCoordinates || dropoffCoordinates) {
      // If only one coordinate is available, center on that point
      const coords = pickupCoordinates || dropoffCoordinates;
      const parsed = parseCoordinates(coords);
      if (parsed) {
        setCenter(parsed);
        setZoom(13);
      }
    }
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(error.message);
    }
  }, [pickupCoordinates, dropoffCoordinates]);

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
              <div className="route-line-visual"></div>
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
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
        preferCanvas={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
          
          {/* Pickup Marker */}
          {pickupCoords && Array.isArray(pickupCoords) && !isNaN(pickupCoords[0]) && !isNaN(pickupCoords[1]) && (
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>
                <div className="marker-popup">
                  <h4>📍 Pickup Location</h4>
                  <p>{pickupLocation || 'Pickup point'}</p>
                  <small>Coordinates: {pickupCoords[0].toFixed(6)}, {pickupCoords[1].toFixed(6)}</small>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Dropoff Marker */}
          {dropoffCoords && Array.isArray(dropoffCoords) && !isNaN(dropoffCoords[0]) && !isNaN(dropoffCoords[1]) && (
            <Marker position={dropoffCoords} icon={dropoffIcon}>
              <Popup>
                <div className="marker-popup">
                  <h4>🎯 Dropoff Location</h4>
                  <p>{dropoffLocation || 'Dropoff point'}</p>
                  <small>Coordinates: {dropoffCoords[0].toFixed(6)}, {dropoffCoords[1].toFixed(6)}</small>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          {routeLine.length === 2 && (
            <Polyline
              positions={routeLine}
              color="#22bc44"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      
      {/* Route Summary */}
      {pickupCoords && dropoffCoords && (
        <div className="route-summary">
          <div className="route-item">
            <span className="route-icon pickup">📍</span>
            <div>
              <div className="route-label">Pickup</div>
              <div className="route-address">{pickupLocation || 'Pickup location'}</div>
            </div>
          </div>
          <div className="route-line">
            <div className="route-distance">
              {calculateDistance(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]).toFixed(1)} km
            </div>
          </div>
          <div className="route-item">
            <span className="route-icon dropoff">🎯</span>
            <div>
              <div className="route-label">Dropoff</div>
              <div className="route-address">{dropoffLocation || 'Dropoff location'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('Map rendering error:', error);
    setMapError(error.message);
    // Return the fallback UI
    return (
      <div className={`map-route-container ${className}`}>
        <div className="map-fallback">
          <div className="fallback-content">
            <h4>🗺️ Route Map</h4>
            <div className="route-visualization">
              <div className="route-line-visual"></div>
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
