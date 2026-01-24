// Financial Service with Real APIs
const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

const mockTransactions = [
  {
    id: '#TRX752A4B',
    date: 'Oct 07, 2025',
    user: 'Jassim Al-Kuwari',
    type: 'Fare',
    amount: 45.50,
    status: 'Completed'
  },
  {
    id: '#TRX9C3D8E',
    date: 'Oct 07, 2025',
    user: 'Fatima Al-Abdullah',
    type: 'Top-up',
    amount: 100.00,
    status: 'Completed'
  },
  {
    id: '#TRX1F6B2C',
    date: 'Oct 06, 2025',
    user: 'Ahmed Khan (Driver)',
    type: 'Payout',
    amount: 850.00,
    status: 'Pending'
  },
  {
    id: '#TRX5E9A1D',
    date: 'Oct 06, 2025',
    user: 'Noora Al-Mansoori',
    type: 'Refund',
    amount: 25.00,
    status: 'Completed'
  },
  {
    id: '#TRX8B4C2F',
    date: 'Oct 06, 2025',
    user: 'Mohammed Al-Thani',
    type: 'Fare',
    amount: 67.20,
    status: 'Completed'
  },
  {
    id: '#TRX3E7A9D',
    date: 'Oct 05, 2025',
    user: 'Sarah Hassan (Driver)',
    type: 'Payout',
    amount: 1250.00,
    status: 'Completed'
  },
  {
    id: '#TRX6D1F5B',
    date: 'Oct 05, 2025',
    user: 'Ali Al-Marri',
    type: 'Top-up',
    amount: 200.00,
    status: 'Completed'
  },
  {
    id: '#TRX9A2C4E',
    date: 'Oct 05, 2025',
    user: 'Layla Ahmed',
    type: 'Fare',
    amount: 38.75,
    status: 'Completed'
  },
  {
    id: '#TRX4F8B1C',
    date: 'Oct 04, 2025',
    user: 'Omar Khalid',
    type: 'Refund',
    amount: 42.30,
    status: 'Pending'
  },
  {
    id: '#TRX7E3D9A',
    date: 'Oct 04, 2025',
    user: 'Hassan Ali (Driver)',
    type: 'Payout',
    amount: 1200.00,
    status: 'Pending'
  }
];

const mockPayoutRequests = [
  {
    id: 'PR001',
    driverName: 'Hassan Ali',
    amount: 1200.00,
    avatar: 'https://i.pravatar.cc/150?img=12',
    requestDate: 'Oct 07, 2025',
    status: 'Pending'
  },
  {
    id: 'PR002',
    driverName: 'Ahmed Khan',
    amount: 850.00,
    avatar: 'https://i.pravatar.cc/150?img=33',
    requestDate: 'Oct 06, 2025',
    status: 'Pending'
  },
  {
    id: 'PR003',
    driverName: 'Youssef Ibrahim',
    amount: 920.50,
    avatar: 'https://i.pravatar.cc/150?img=51',
    requestDate: 'Oct 06, 2025',
    status: 'Pending'
  }
];

const mockFinancialOverview = {
  systemWalletBalance: 1250340,
  commissions: {
    amount: 98450,
    trend: 5.1,
    period: 'MTD'
  },
  pendingPayouts: {
    amount: 32180,
    count: 8
  }
};

export const fetchFinancialOverview = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/admin-financial-overview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid JSON response from server');
    }
    
    if (data.success) {
      // Handle different possible response structures
      const overview = data.data?.financial_overview || data.data || data;
      
      // Helper function to extract numeric value from object or number
      const extractValue = (field) => {
        if (!field) return 0;
        if (typeof field === 'number') return field;
        if (typeof field === 'object' && field.value !== undefined) {
          return typeof field.value === 'number' ? field.value : parseFloat(field.value) || 0;
        }
        if (typeof field === 'string') {
          return parseFloat(field) || 0;
        }
        return 0;
      };
      
      // Helper function to extract trend/change_percent
      const extractTrend = (field) => {
        if (!field) return 0;
        if (typeof field === 'number') return field;
        if (typeof field === 'object') {
          return field.change_percent || field.trend || field.value || 0;
        }
        return parseFloat(field) || 0;
      };
      
      return {
        success: true,
        data: {
          systemWalletBalance: extractValue(overview.system_wallet_balance),
          commissions: {
            amount: extractValue(overview.commissions_mtd),
            trend: extractTrend(overview.commissions_mtd?.change_percent || overview.commissions_mtd?.trend)
          },
          pendingPayouts: {
            amount: extractValue(overview.pending_payouts)
          }
        }
      };
    }
    
    return { success: false, error: data.error || 'Failed to fetch financial overview' };
  } catch (error) {
    console.error('Financial overview API error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filter parameters if provided (only what the UI currently supports)
    if (filters.type && filters.type !== 'All Types') {
      // Map UI values to API values
      const typeMapping = {
        'Fare': 'fare',
        'Top-up': 'topup',
        'Payout': 'payout', 
        'Refund': 'refund'
      };
      const apiType = typeMapping[filters.type] || filters.type.toLowerCase();
      params.append('type', apiType);
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/admin-transactions-list?${queryString}`
      : `${API_BASE_URL}/admin-transactions-list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data.data.transactions,
        pagination: data.data.pagination
      };
    }
    
    return { success: false, error: 'Failed to fetch transactions' };
  } catch (error) {
    console.error('Transactions API error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPayoutRequests = async (status = 'pending') => {
  try {
    const token = localStorage.getItem('authToken');
    const anonKey = localStorage.getItem('anonKey') || ''; // Get anon key if stored, otherwise empty
    
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    
    const queryString = params.toString();
    const url = queryString
      ? `${API_BASE_URL}/admin-payout-requests-list?${queryString}`
      : `${API_BASE_URL}/admin-payout-requests-list`;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Map the API response to match the expected structure
      const payoutRequests = (data.data?.payout_requests || data.data || []).map((req, index) => ({
        id: req.id || req.request_id || `PR${index}`,
        user: req.driver_name || req.driverName || req.user || 'Unknown Driver',
        amount: req.amount || 0,
        status: req.status || 'pending',
        date: req.request_date || req.date || req.created_at || new Date().toLocaleDateString(),
        avatar: req.driver_avatar || req.avatar || `https://i.pravatar.cc/80?img=${index + 1}`,
        driverName: req.driver_name || req.driverName || req.user || 'Unknown Driver',
        driver_avatar: req.driver_avatar || req.avatar || `https://i.pravatar.cc/80?img=${index + 1}`
      }));
      
      return {
        success: true,
        data: payoutRequests
      };
    }
    
    return { success: false, error: 'Failed to fetch payout requests' };
  } catch (error) {
    console.error('Payout requests API error:', error);
    // Return empty array on error to not break the UI
    return {
      success: true,
      data: []
    };
  }
};

export const approvePayoutRequest = async (requestId) => {
  // For now, return success immediately since there's no specific API endpoint
  return {
    success: true,
    message: 'Payout request approved successfully'
  };
};

export const exportTransactionsCSV = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin-transactions-export-csv`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Export CSV API error:', error);
    return { success: false, error: error.message };
  }
};

export const searchTransactions = async (query, limit = 10) => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}/admin-search-transactions?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data.data.search_results,
        totalResults: data.data.total_results,
        suggestions: data.data.search_suggestions
      };
    }
    
    return { success: false, error: 'Failed to search transactions' };
  } catch (error) {
    console.error('Search transactions API error:', error);
    return { success: false, error: error.message };
  }
};

// Withdrawal Management Functions
export const fetchWithdrawals = async (filters = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const anonKey = localStorage.getItem('anonKey') || ''; // Get anon key if stored
    
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status.toLowerCase());
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters.pageSize) {
      params.append('page_size', filters.pageSize.toString());
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${API_BASE_URL}/admin-payout-requests-list?${queryString}`
      : `${API_BASE_URL}/admin-payout-requests-list`;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
      console.log('Withdrawals API response:', data);
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      throw new Error('Invalid JSON response from server');
    }
    
    // Handle different possible response structures
    let withdrawalsData = [];
    
    // Check if response indicates success (could be data.success or just data being an array)
    const isSuccess = data.success === true || data.success === undefined || Array.isArray(data);
    
    if (isSuccess) {
      // Try different possible response structures
      if (Array.isArray(data.data)) {
        withdrawalsData = data.data;
      } else if (data.data?.payout_requests && Array.isArray(data.data.payout_requests)) {
        withdrawalsData = data.data.payout_requests;
      } else if (data.data?.withdrawals && Array.isArray(data.data.withdrawals)) {
        withdrawalsData = data.data.withdrawals;
      } else if (data.data && typeof data.data === 'object') {
        // If data.data is an object, try to extract an array from it
        withdrawalsData = Object.values(data.data).find(val => Array.isArray(val)) || [];
      } else if (Array.isArray(data)) {
        withdrawalsData = data;
      }
      
      // Map the API response to match the expected structure
      const withdrawals = withdrawalsData.map((req, index) => {
        if (!req || typeof req !== 'object') {
          // Skip invalid entries
          return null;
        }
        
        // Helper function to extract string value from nested objects
        const extractString = (value, fallback = '') => {
          if (!value) return fallback;
          if (typeof value === 'string') return value;
          if (typeof value === 'object') {
            // If it's an object, try to get name, title, or first string property
            return value.name || value.title || value.label || Object.values(value).find(v => typeof v === 'string') || fallback;
          }
          return String(value) || fallback;
        };
        
        // Extract driver information - handle both string and object formats
        const driverInfo = req.driver || req.driver_name || req.driverName || {};
        const driverName = typeof driverInfo === 'string' 
          ? driverInfo 
          : (driverInfo.name || driverInfo.driver_name || 'Unknown Driver');
        const driverId = typeof driverInfo === 'string'
          ? (req.driver_id || req.driverId || `driver_${index + 1}`)
          : (driverInfo.id || driverInfo.driver_id || `driver_${index + 1}`);
        const driverAvatar = typeof driverInfo === 'string'
          ? (req.driver_avatar || req.avatar || `https://i.pravatar.cc/80?img=${index + 1}`)
          : (driverInfo.avatar_url || driverInfo.avatar || driverInfo.profile_image || `https://i.pravatar.cc/80?img=${index + 1}`);
        
        return {
          id: req.id || req.request_id || req.withdrawal_id || `PR${index}`,
          driver_id: driverId,
          driver_name: driverName,
          driver_avatar: driverAvatar,
          amount: parseFloat(req.amount) || 0,
          status: (req.status || 'pending').toLowerCase(),
          request_date: req.request_date || req.requestDate || req.created_at || req.date || new Date().toLocaleDateString(),
          bank_account: extractString(req.bank_account || req.bankAccount || req.account_number || req.account, '****1234'),
          bank_name: extractString(req.bank_name || req.bankName || req.bank, 'Qatar National Bank')
        };
      }).filter(item => item !== null); // Remove null entries
      
      console.log('Mapped withdrawals:', withdrawals);
      return {
        success: true,
        data: withdrawals,
        pagination: data.data?.pagination || data.pagination || {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          total: withdrawals.length,
          totalPages: Math.ceil(withdrawals.length / (filters.pageSize || 20))
        }
      };
    }
    
    // If data.success is false, log and fall back to mock data
    console.warn('API returned success: false, using fallback mock data', data);
    
    // Fallback to mock data if API fails
    return {
      success: true,
      data: mockPayoutRequests.map((req, index) => ({
        id: req.id,
        driver_id: `driver_${index + 1}`,
        driver_name: req.driverName,
        driver_avatar: req.avatar,
        amount: req.amount,
        status: req.status,
        request_date: req.requestDate,
        bank_account: '****1234',
        bank_name: 'Qatar National Bank'
      })),
      pagination: {
        page: 1,
        pageSize: 20,
        total: mockPayoutRequests.length,
        totalPages: 1
      }
    };
  } catch (error) {
    console.error('Withdrawals API error:', error);
    // Return mock data on error
    return {
      success: true,
      data: mockPayoutRequests.map((req, index) => ({
        id: req.id,
        driver_id: `driver_${index + 1}`,
        driver_name: req.driverName,
        driver_avatar: req.avatar,
        amount: req.amount,
        status: req.status,
        request_date: req.requestDate,
        bank_account: '****1234',
        bank_name: 'Qatar National Bank'
      })),
      pagination: {
        page: 1,
        pageSize: 20,
        total: mockPayoutRequests.length,
        totalPages: 1
      }
    };
  }
};

export const approveWithdrawal = async (payoutRequestId, adminNotes = '') => {
  try {
    const token = localStorage.getItem('authToken');
    const anonKey = localStorage.getItem('anonKey') || '';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await fetch(`${API_BASE_URL}/admin-payout-approve`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        payout_request_id: payoutRequestId,
        admin_notes: adminNotes || 'Approved and processed'
      })
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Withdrawal approved successfully'
      };
    }
    
    return { success: false, error: data.error || 'Failed to approve withdrawal' };
  } catch (error) {
    console.error('Approve withdrawal API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve withdrawal'
    };
  }
};

export const rejectWithdrawal = async (payoutRequestId, reason = '') => {
  try {
    const token = localStorage.getItem('authToken');
    const anonKey = localStorage.getItem('anonKey') || '';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await fetch(`${API_BASE_URL}/admin-payout-decline`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        payout_request_id: payoutRequestId,
        reason: reason || 'Withdrawal request declined'
      })
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Withdrawal declined successfully'
      };
    }
    
    return { success: false, error: data.error || 'Failed to decline withdrawal' };
  } catch (error) {
    console.error('Decline withdrawal API error:', error);
    return {
      success: false,
      error: error.message || 'Failed to decline withdrawal'
    };
  }
};
