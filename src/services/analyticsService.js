// Analytics API Integration

import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

// Helper function to add default colors to data arrays
const addColorsToData = (data, colorPalette) => {
  return data.map((item, index) => ({
    ...item,
    color: colorPalette[index % colorPalette.length]
  }));
};

// Fetch all analytics data from API
export const fetchAnalyticsReports = async (startDate, endDate) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔄 FETCHING ANALYTICS REPORTS:', {
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '⏰ Timestamp': new Date().toISOString()
    });

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });

    const response = await fetch(`${API_BASE_URL}/admin-analytics-reports?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('📡 ANALYTICS API RESPONSE:', {
      '✅ Success': result.success,
      '📊 Has Data': !!result.data,
      '🔍 Full Result': result
    });

    if (!result.success) {
      throw new Error(result.error || 'API returned unsuccessful response');
    }

    // Transform API response to match UI data structure
    const transformedData = transformAnalyticsData(result.data);

    return {
      success: true,
      data: transformedData
    };

  } catch (error) {
    console.error('❌ Analytics API Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch analytics data'
    };
  }
};

// Transform API response to match existing UI data structure
const transformAnalyticsData = (apiData) => {
  const { metrics, rides_by_region, rides_by_vehicle_type, driver_acceptance_by_time, driver_performance_leaderboard, revenue_by_payment_type } = apiData;

  // Color palettes for visualizations
  const regionColors = ['#FDE68A', '#FCA5A5', '#A7F3D0', '#BFDBFE', '#DDD6FE'];
  const vehicleColors = ['#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE'];
  const timeColors = ['#A7F3D0', '#BFDBFE', '#FED7AA', '#DDD6FE', '#A7F3D0', '#FCA5A5'];
  const paymentColors = ['#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE'];

  // Transform metrics
  const transformedMetrics = {
    averageFare: {
      value: metrics?.average_fare?.value || 0,
      trend: metrics?.average_fare?.comparison_text || '+0.0% this week',
      trendPositive: metrics?.average_fare?.change_direction === 'up',
      currency: metrics?.average_fare?.currency || 'QAR'
    },
    peakHours: {
      value: metrics?.peak_hours?.time_range || 'N/A',
      description: metrics?.peak_hours?.description || 'Highest ride volume',
      rideCount: metrics?.peak_hours?.ride_count || 0
    },
    avgDriverRating: {
      value: metrics?.avg_driver_rating?.value || 0,
      trend: metrics?.avg_driver_rating?.comparison_text || '+0.00 this week',
      trendPositive: metrics?.avg_driver_rating?.change_direction === 'up'
    },
    totalDistance: {
      value: metrics?.total_distance?.value || 0,
      unit: metrics?.total_distance?.unit || 'km',
      description: metrics?.total_distance?.description || 'Driven this week'
    },
    driverAcceptanceRate: {
      value: metrics?.driver_acceptance_rate?.value || 0,
      unit: '%',
      trend: metrics?.driver_acceptance_rate?.comparison_text || '+0.0% this week',
      trendPositive: metrics?.driver_acceptance_rate?.change_direction === 'up'
    }
  };

  // Transform rides by region - provide fallback data if empty
  const transformedRidesByRegion = rides_by_region && rides_by_region.length > 0 
    ? addColorsToData(rides_by_region, regionColors)
    : [
        { region: 'Doha', rides: 0, color: regionColors[0] },
        { region: 'Al Rayyan', rides: 0, color: regionColors[1] },
        { region: 'Al Wakrah', rides: 0, color: regionColors[2] },
        { region: 'Umm Salal', rides: 0, color: regionColors[3] },
        { region: 'Al Khor', rides: 0, color: regionColors[4] }
      ];

  // Transform rides by vehicle type - provide fallback data if empty
  const transformedRidesByVehicleType = rides_by_vehicle_type && rides_by_vehicle_type.length > 0
    ? addColorsToData(rides_by_vehicle_type, vehicleColors)
    : [
        { type: 'Sedan', percentage: 0, rides: 0, color: vehicleColors[0] },
        { type: 'SUV', percentage: 0, rides: 0, color: vehicleColors[1] },
        { type: 'Luxury', percentage: 0, rides: 0, color: vehicleColors[2] },
        { type: 'Van', percentage: 0, rides: 0, color: vehicleColors[3] }
      ];

  // Transform acceptance rate by time - provide fallback data if empty
  const transformedAcceptanceRateByHour = driver_acceptance_by_time && driver_acceptance_by_time.length > 0
    ? addColorsToData(driver_acceptance_by_time, timeColors)
    : [
        { hour: '6-9 AM', rate: 0, color: timeColors[0] },
        { hour: '9-12 PM', rate: 0, color: timeColors[1] },
        { hour: '12-3 PM', rate: 0, color: timeColors[2] },
        { hour: '3-6 PM', rate: 0, color: timeColors[3] },
        { hour: '6-9 PM', rate: 0, color: timeColors[4] },
        { hour: '9-12 AM', rate: 0, color: timeColors[5] }
      ];

  // Transform driver leaderboard - provide fallback data if empty
  const transformedDriverLeaderboard = driver_performance_leaderboard && driver_performance_leaderboard.length > 0
    ? driver_performance_leaderboard.map(driver => ({
        id: driver.id || Math.random(),
        name: driver.name || 'Unknown Driver',
        avatar: driver.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`,
        rides: driver.rides || 0,
        rating: driver.rating || 0,
        acceptanceRate: driver.acceptance_rate || 0
      }))
    : [
        { id: 1, name: 'No Data Available', avatar: 'https://i.pravatar.cc/150?img=1', rides: 0, rating: 0, acceptanceRate: 0 }
      ];

  // Transform revenue by payment type - provide fallback data if empty
  const transformedRevenueByPaymentType = revenue_by_payment_type && revenue_by_payment_type.length > 0
    ? addColorsToData(revenue_by_payment_type, paymentColors)
    : [
        { type: 'Credit Card', percentage: 0, amount: 0, color: paymentColors[0] },
        { type: 'Cash', percentage: 0, amount: 0, color: paymentColors[1] },
        { type: 'Wallet', percentage: 0, amount: 0, color: paymentColors[2] },
        { type: 'Other', percentage: 0, amount: 0, color: paymentColors[3] }
      ];

  return {
    metrics: transformedMetrics,
    ridesByRegion: transformedRidesByRegion,
    ridesByVehicleType: transformedRidesByVehicleType,
    acceptanceRateByHour: transformedAcceptanceRateByHour,
    driverLeaderboard: transformedDriverLeaderboard,
    revenueByPaymentType: transformedRevenueByPaymentType
  };
};

// Legacy functions for backward compatibility (now call the main API function)
export const fetchAnalyticsMetrics = async () => {
  // Default to last week's data if no dates provided
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.metrics || null
  };
};

export const fetchRidesByRegion = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.ridesByRegion || []
  };
};

export const fetchRidesByVehicleType = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.ridesByVehicleType || []
  };
};

export const fetchAcceptanceRateByHour = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.acceptanceRateByHour || []
  };
};

export const fetchDriverLeaderboard = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.driverLeaderboard || []
  };
};

export const fetchRevenueByPaymentType = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const startDateISO = startDate.toISOString();
  const endDateISO = endDate.toISOString();
  
  const result = await fetchAnalyticsReports(startDateISO, endDateISO);
  return {
    success: result.success,
    data: result.data?.revenueByPaymentType || []
  };
};

// Export analytics report (downloads as CSV from backend API)
export const exportAnalyticsReport = async (startDate, endDate) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔄 EXPORTING ANALYTICS CSV:', {
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '⏰ Timestamp': new Date().toISOString()
    });

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });

    const response = await fetch(`${API_BASE_URL}/admin-analytics-export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is actually CSV content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/csv')) {
      // If not CSV, try to parse as JSON for error messages
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid response format');
    }

    // Get the CSV content as blob
    const csvBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV EXPORT SUCCESSFUL');
    return { success: true };
    
  } catch (error) {
    console.error('❌ CSV Export Error:', error);
    return { success: false, error: error.message || 'Failed to export CSV' };
  }
};

// Export analytics data as JSON (downloads from backend API)
export const exportAnalyticsAsJSON = async (startDate, endDate) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔄 EXPORTING ANALYTICS JSON:', {
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '⏰ Timestamp': new Date().toISOString()
    });

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      format: 'json'
    });

    const response = await fetch(`${API_BASE_URL}/admin-analytics-export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is actually JSON content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, try to parse as text for error messages
      const errorText = await response.text();
      throw new Error(errorText || 'Invalid response format');
    }

    // Get the JSON content as blob
    const jsonBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ JSON EXPORT SUCCESSFUL');
    return { success: true };
    
  } catch (error) {
    console.error('❌ JSON Export Error:', error);
    return { success: false, error: error.message || 'Failed to export JSON' };
  }
};

// Export only revenue data as CSV (downloads from backend API)
export const exportRevenueData = async (startDate, endDate) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔄 EXPORTING REVENUE DATA CSV:', {
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '📊 Section': 'revenue_by_payment_type',
      '⏰ Timestamp': new Date().toISOString()
    });

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      sections: 'revenue_by_payment_type',
      format: 'csv'
    });

    const response = await fetch(`${API_BASE_URL}/admin-analytics-export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is actually CSV content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/csv')) {
      // If not CSV, try to parse as JSON for error messages
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid response format');
    }

    // Get the CSV content as blob
    const csvBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ REVENUE DATA CSV EXPORT SUCCESSFUL');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Revenue Data Export Error:', error);
    return { success: false, error: error.message || 'Failed to export revenue data' };
  }
};

// Export specific sections as CSV (downloads from backend API)
export const exportSpecificSections = async (startDate, endDate, sections) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate sections array
    if (!sections || sections.length === 0) {
      throw new Error('No sections selected for export');
    }

    // Map UI-friendly section names to API-expected keys
    const sectionMapping = {
      'Metrics': 'metrics',
      'Rides by Region': 'rides_by_region',
      'Rides by Vehicle Type': 'rides_by_vehicle_type',
      'Driver Acceptance by Hour': 'driver_acceptance_by_time',
      'Driver Performance Leaderboard': 'driver_performance_leaderboard',
      'Revenue by Payment Type': 'revenue_by_payment_type'
    };

    // Convert UI section names to API keys
    const apiSections = sections.map(section => {
      if (sectionMapping[section]) {
        return sectionMapping[section];
      } else {
        console.warn(`Unknown section: ${section}`);
        return section.toLowerCase().replace(/\s+/g, '_');
      }
    });

    // Join sections with commas for API parameter
    const sectionsParam = apiSections.join(',');

    console.log('🔄 EXPORTING SPECIFIC SECTIONS CSV:', {
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '📊 Sections': sections,
      '🔧 API Sections': sectionsParam,
      '⏰ Timestamp': new Date().toISOString()
    });

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      sections: sectionsParam,
      format: 'csv'
    });

    const response = await fetch(`${API_BASE_URL}/admin-analytics-export?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check if response is actually CSV content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/csv')) {
      // If not CSV, try to parse as JSON for error messages
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid response format');
    }

    // Get the CSV content as blob
    const csvBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-sections-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ SPECIFIC SECTIONS CSV EXPORT SUCCESSFUL');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Specific Sections Export Error:', error);
    return { success: false, error: error.message || 'Failed to export specific sections' };
  }
};

