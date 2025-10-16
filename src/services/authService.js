const SUPABASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/auth/v1/token?grant_type=password';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_API_KEY,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Login failed');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const storeAuthToken = (token) => {
  localStorage.setItem('authToken', token);
  
  // Log the bearer token for debugging
  console.log('🔑 BEARER TOKEN STORED:', {
    '🔑 Token': token,
    '📏 Token Length': token?.length,
    '🔍 Token Preview': token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'No token',
    '⏰ Timestamp': new Date().toISOString()
  });
  
  // Also log to terminal for debugging
  console.log('\n' + '='.repeat(80));
  console.log('🔑 BEARER TOKEN (for terminal debugging):');
  console.log('='.repeat(80));
  console.log(token);
  console.log('='.repeat(80) + '\n');
};

export const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  
  // Log when token is retrieved
  console.log('🔍 AUTH TOKEN RETRIEVED:', {
    '🔑 Token': token,
    '📏 Token Length': token?.length,
    '🔍 Token Preview': token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'No token',
    '✅ Has Token': !!token,
    '⏰ Retrieved At': new Date().toISOString()
  });
  
  return token;
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Logout failed');
    }

    // Clear token regardless of API response
    localStorage.removeItem('authToken');
    return { success: true };
  } catch (error) {
    console.error('Logout API Error:', error);
    // Still clear token even if API fails
    localStorage.removeItem('authToken');
    return { success: false, error: error.message };
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
};
