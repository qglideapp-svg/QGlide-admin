import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

// Fetch users list with filters
export const fetchUsersList = async (searchTerm = '', statusFilter = '', ratingFilter = '', page = 1, limit = 20) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Build URL with query parameters
    let url = `${API_BASE_URL}/admin-users-list`;
    const params = [];
    
    if (searchTerm && searchTerm.trim()) {
      params.push(`search=${encodeURIComponent(searchTerm.trim())}`);
    }
    
    if (statusFilter && statusFilter !== 'All' && statusFilter.toLowerCase() !== 'all') {
      params.push(`status=${encodeURIComponent(statusFilter.toLowerCase())}`);
    }
    
    if (ratingFilter && ratingFilter !== 'Any' && ratingFilter !== 'Any Rating') {
      // Extract numeric value from rating filter (e.g., "4.5+" -> "4.5")
      const ratingValue = ratingFilter.replace('+', '');
      params.push(`min_rating=${encodeURIComponent(ratingValue)}`);
    }
    
    // Add pagination parameters
    params.push(`page=${page}`);
    params.push(`limit=${limit}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    console.log('🚀 FETCH USERS LIST REQUEST:', {
      '🔗 URL': url,
      '🔍 Search Term': searchTerm,
      '📊 Status Filter': statusFilter,
      '⭐ Rating Filter': ratingFilter,
      '📄 Page': page,
      '📏 Limit': limit,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('📡 FETCH USERS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 RAW USERS API RESPONSE:', JSON.stringify(data, null, 2));
    
    // Parse API response - check multiple possible structures
    let usersArray = [];
    
    if (Array.isArray(data)) {
      usersArray = data;
      console.log('✅ Found users as direct array');
    } else if (data.data && Array.isArray(data.data.users)) {
      usersArray = data.data.users;
      console.log('✅ Found users in data.data.users');
    } else if (data.users && Array.isArray(data.users)) {
      usersArray = data.users;
      console.log('✅ Found users in data.users');
    } else if (data.data && Array.isArray(data.data)) {
      usersArray = data.data;
      console.log('✅ Found users in data.data');
    } else if (data.results && Array.isArray(data.results)) {
      usersArray = data.results;
      console.log('✅ Found users in data.results');
    } else {
      console.log('❌ No users array found in response');
      console.log('Available keys:', Object.keys(data));
    }
    
    const transformedData = {
      users: usersArray,
      totalCount: data.data?.total_count || data.totalCount || data.total || data.count || usersArray.length,
      totalPages: data.data?.total_pages || data.totalPages || Math.ceil((data.data?.total_count || data.totalCount || data.total || data.count || usersArray.length) / limit),
      currentPage: data.data?.page || data.page || page,
      hasNextPage: data.data?.hasNextPage || data.hasNextPage || false,
      hasPrevPage: data.data?.hasPrevPage || data.hasPrevPage || false
    };

    console.log('🔍 FULL USERS API RESPONSE DEBUG:', {
      '📡 Raw Response': data,
      '🔍 Response Type': typeof data,
      '📊 Is Object': typeof data === 'object',
      '🔢 Response Keys': Object.keys(data || {}),
      '📝 Users Array': usersArray,
      '📏 Users Length': usersArray.length,
      '🔍 First User': usersArray[0] || 'No users',
      '📋 All Users': usersArray,
      '⚙️ Transformed Data': transformedData,
      '🔗 Request URL': url,
      '📊 Pagination': {
        totalCount: transformedData.totalCount,
        totalPages: transformedData.totalPages,
        currentPage: transformedData.currentPage,
        hasNextPage: transformedData.hasNextPage,
        hasPrevPage: transformedData.hasPrevPage
      }
    });
    
    return { 
      success: true, 
      data: transformedData
    };
  } catch (error) {
    console.error('❌ FETCH USERS LIST ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch users list' 
    };
  }
};

// Fetch user details by ID
export const fetchUserDetails = async (userId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-user-details?user_id=${userId}`;
    
    console.log('🚀 FETCH USER DETAILS REQUEST:', {
      '🔗 URL': url,
      '🆔 User ID': userId,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('📡 FETCH USER DETAILS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 RAW USER DETAILS RESPONSE:', JSON.stringify(data, null, 2));
    
    // Extract user from response
    if (data.success && data.data && data.data.user) {
      console.log('✅ USER DETAILS EXTRACTED SUCCESSFULLY:', {
        '📊 User Data': data.data.user,
        '🔍 User ID': data.data.user.id,
        '👤 User Name': data.data.user.full_name,
        '📱 Phone': data.data.user.phone,
        '💰 Earnings': data.data.user.earnings,
        '🚕 Recent Rides': data.data.user.recent_rides
      });
      
      return { success: true, data: data.data.user };
    }
    
    console.log('❌ INVALID USER DETAILS RESPONSE STRUCTURE:', {
      '📊 Raw Data': data,
      '🔍 Success': data.success,
      '🔍 Has Data': !!data.data,
      '🔍 Has User': !!data.data?.user
    });
    
    return { success: false, error: 'Invalid response structure' };
  } catch (error) {
    console.error('❌ FETCH USER DETAILS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch user details' 
    };
  }
};

// Update user profile
export const updateUser = async (userId, userData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-update-user`;
    
    console.log('🚀 UPDATE USER PROFILE REQUEST:', {
      '🔗 URL': url,
      '🆔 User ID': userId,
      '📝 User Data': userData,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId,
        full_name: userData.full_name,
        phone: userData.phone,
        email: userData.email
      })
    });

    console.log('📡 UPDATE USER PROFILE HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 UPDATE USER PROFILE RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UPDATE USER PROFILE ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to update user profile' 
    };
  }
};

// Delete user account
export const deleteUser = async (userId, reason) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-delete-user`;
    
    console.log('🚀 DELETE USER REQUEST:', {
      '🔗 URL': url,
      '🆔 User ID': userId,
      '📝 Reason': reason,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId,
        reason: reason
      })
    });

    console.log('📡 DELETE USER HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 DELETE USER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ DELETE USER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to delete user account' 
    };
  }
};

// Update user status (deactivate/activate)
export const updateUserStatus = async (userId, status, reason) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-update-user-status`;
    
    console.log('🚀 UPDATE USER STATUS REQUEST:', {
      '🔗 URL': url,
      '🆔 User ID': userId,
      '📊 Status': status,
      '📝 Reason': reason,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId,
        status: status,
        reason: reason
      })
    });

    console.log('📡 UPDATE USER STATUS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 UPDATE USER STATUS RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UPDATE USER STATUS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to update user status' 
    };
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-create-user`;
    
    console.log('🚀 CREATE USER REQUEST:', {
      '🔗 URL': url,
      '📝 User Data': userData,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password
      })
    });

    console.log('📡 CREATE USER HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 CREATE USER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ CREATE USER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to create user' 
    };
  }
};

// Export users to CSV
export const exportUsersToCSV = async (status = '') => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    let url = `${API_BASE_URL}/admin-users-export-csv`;
    if (status && status !== 'All' && status.toLowerCase() !== 'all') {
      url += `?status=${encodeURIComponent(status.toLowerCase())}`;
    }

    console.log('🚀 EXPORT USERS CSV REQUEST:', {
      '🔗 URL': url,
      '📊 Status Filter': status,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('📡 EXPORT CSV HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok,
      '📋 Content Type': response.headers.get('content-type'),
      '📏 Content Length': response.headers.get('content-length')
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is CSV content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      const csvContent = await response.text();
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `users_export_${timestamp}.csv`;
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);
      
      console.log('✅ CSV EXPORT SUCCESSFUL:', {
        '📄 Filename': filename,
        '📏 Content Length': csvContent.length,
        '📊 Export Filter': { status }
      });
      
      return { success: true, filename, size: csvContent.length };
    } else {
      // If not CSV, try to parse as JSON for error messages
      const data = await response.json();
      console.log('📡 EXPORT RESPONSE (JSON):', JSON.stringify(data, null, 2));
      
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ EXPORT CSV ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to export users to CSV' 
    };
  }
};

// Transform user data from API format to UI format
export const transformUserData = (apiUser) => {
  return {
    id: apiUser.id || apiUser.user_id || '',
    name: apiUser.full_name || apiUser.name || 'Unknown User',
    avatar: apiUser.avatar_url || apiUser.profile_picture || 'https://i.pravatar.cc/40',
    joinedDate: apiUser.created_at ? new Date(apiUser.created_at).toISOString().split('T')[0] : 'N/A',
    contact: apiUser.email || apiUser.phone || apiUser.phone_number || 'N/A',
    totalRides: parseInt(apiUser.total_rides || apiUser.rides_count || 0),
    lastRide: apiUser.last_ride_date || 'N/A',
    rating: parseFloat(apiUser.rating || apiUser.average_rating || 0),
    status: apiUser.status || 'Active'
  };
};
