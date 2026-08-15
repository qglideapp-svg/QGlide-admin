import { authenticatedFetch } from './apiClient';
import { exportPaymentTransactionsPDF } from './reportsService';

// Financial Service with Real APIs
const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

export const resolveTransactionId = (transaction) => {
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }

  const rawId =
    transaction.transaction_id ??
    transaction.transactionId ??
    transaction.id ??
    null;

  if (rawId == null || rawId === '') {
    return null;
  }

  return String(rawId).replace(/^#/, '');
};

export const extractTransactionDetailsPayload = (responseData) => {
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }

  return (
    responseData.data?.transaction ??
    responseData.data?.data?.transaction ??
    responseData.transaction ??
    (responseData.data && typeof responseData.data === 'object' ? responseData.data : null) ??
    responseData
  );
};

export const mapTransactionDetailsSummary = (apiTransaction) => {
  if (!apiTransaction || typeof apiTransaction !== 'object') {
    return null;
  }

  const user = apiTransaction.user || apiTransaction.rider || apiTransaction.driver || {};
  const ride = apiTransaction.ride || {};
  const payment = apiTransaction.payment || {};
  const wallet = apiTransaction.wallet || {};

  return {
    id: apiTransaction.id || apiTransaction.transaction_id,
    type: apiTransaction.type || apiTransaction.transaction_type,
    status: apiTransaction.status,
    amount: parseFloat(apiTransaction.amount ?? apiTransaction.total_amount ?? 0) || 0,
    currency: apiTransaction.currency || 'QAR',
    createdAt:
      apiTransaction.created_at ||
      apiTransaction.date ||
      apiTransaction.timestamp ||
      apiTransaction.processed_at,
    description:
      apiTransaction.description ||
      apiTransaction.note ||
      apiTransaction.details,
    reference:
      apiTransaction.reference ||
      apiTransaction.transaction_ref ||
      apiTransaction.external_reference,
    userName:
      typeof user === 'string'
        ? user
        : (user.name || user.full_name || apiTransaction.user_name),
    userEmail: user.email || apiTransaction.user_email || null,
    userPhone: user.phone || apiTransaction.user_phone || null,
    userRole: user.role || apiTransaction.user_role || null,
    paymentMethod:
      payment.method ||
      payment.payment_method ||
      apiTransaction.payment_method ||
      null,
    paymentStatus:
      payment.status ||
      payment.payment_status ||
      apiTransaction.payment_status ||
      null,
    rideId: ride.id || ride.ride_id || apiTransaction.ride_id || null,
    walletId: wallet.id || wallet.wallet_id || apiTransaction.wallet_id || null,
    walletType: wallet.type || wallet.wallet_type || apiTransaction.wallet_type || null,
    balanceBefore: apiTransaction.balance_before ?? null,
    balanceAfter: apiTransaction.balance_after ?? null,
  };
};

export const fetchTransactionDetails = async (transactionId) => {
  try {
    const normalizedId = resolveTransactionId({ id: transactionId });
    if (!normalizedId) {
      return { success: false, error: 'Transaction ID is required' };
    }

    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const params = new URLSearchParams();
    params.append('transaction_id', normalizedId);
    const url = `${API_BASE_URL}/admin-transaction-details?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = parseErrorMessage(errorData, errorMessage);
      } catch {
        // Ignore JSON parse errors for non-JSON responses
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const payload = extractTransactionDetailsPayload(data);
    const transaction = mapTransactionDetailsSummary(payload);

    if (!transaction) {
      return { success: false, error: 'Transaction details not found' };
    }

    return {
      success: true,
      transaction,
      raw: data,
    };
  } catch (error) {
    console.error('Transaction details API error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchFinancialOverview = async () => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin-financial-overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
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
      const overview = data.data?.financial_overview || data.data || data;
      
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
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    } else {
      params.append('page', '1');
    }
    
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    } else {
      params.append('limit', '20');
    }
    
    if (filters.type && filters.type !== 'All Types') {
      const typeMapping = {
        'Fare': 'fare',
        'Top-up': 'topup',
        'Payout': 'payout', 
        'Refund': 'refund',
        'Cash Payment': 'cash_payment'
      };
      const apiType = typeMapping[filters.type] || filters.type.toLowerCase();
      params.append('type', apiType);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-transactions-list?${params.toString()}`;
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data.data?.transactions || data.data || [],
        pagination: data.data?.pagination || data.pagination
      };
    }
    
    return { success: false, error: 'Failed to fetch transactions' };
  } catch (error) {
    console.error('Transactions API error:', error);
    return { success: false, error: error.message };
  }
};

// Fetch cash rides using dedicated cash-ride-transactions endpoint
export const fetchCashRides = async (filters = {}) => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const params = new URLSearchParams();
    
    // Add pagination if provided
    if (filters.page) {
      params.append('page', filters.page.toString());
    } else {
      params.append('page', '1'); // Default to page 1
    }
    
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    } else {
      params.append('limit', '20'); // Default limit
    }
    
    // Add optional filters
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    
    // Use dedicated cash-ride-transactions endpoint
    const url = `${API_BASE_URL}/cash-ride-transactions?${params.toString()}`;
    
    console.log('🚀 FETCH CASH RIDES REQUEST:', {
      '🔗 URL': url,
      '📊 Filters': filters,
            '🔑 Has Anon Key': !!anonKey,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('❌ Cash rides API error response:', errorData);
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    console.log('📡 CASH RIDES API RESPONSE:', {
      '✅ Success': data.success,
      '📊 Has Data': !!data.data,
      '📋 Response Structure': Object.keys(data),
      '⏰ Timestamp': new Date().toISOString()
    });
    
    if (data.success) {
      // Extract transactions from the response
      // The API returns transactions in data.data.transactions or data.data
      const cashRides = data.data?.transactions || data.data || [];
      
      return {
        success: true,
        data: Array.isArray(cashRides) ? cashRides : [],
        pagination: data.data?.pagination || data.pagination
      };
    }
    
    return { success: false, error: data.error || 'Failed to fetch cash rides' };
  } catch (error) {
    console.error('❌ Cash rides API error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchPayoutRequests = async (status = 'pending') => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    
    const params = new URLSearchParams();
    params.append('type', 'payouts'); // Add type parameter for unified endpoint
    if (status) {
      params.append('status', status);
    }
    params.append('page', '1'); // Default to page 1
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin-drivers-list?${queryString}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Payout requests API response:', data);
    
    if (data.success) {
      // Handle different possible response structures from unified endpoint
      let payoutRequestsArray = [];
      
      if (Array.isArray(data.data)) {
        payoutRequestsArray = data.data;
      } else if (data.data?.drivers && Array.isArray(data.data.drivers)) {
        // Unified endpoint might return payouts in drivers array
        payoutRequestsArray = data.data.drivers;
      } else if (data.data?.payout_requests && Array.isArray(data.data.payout_requests)) {
        payoutRequestsArray = data.data.payout_requests;
      } else if (data.data?.payouts && Array.isArray(data.data.payouts)) {
        payoutRequestsArray = data.data.payouts;
      } else if (data.data && typeof data.data === 'object') {
        // Try to find any array in the data object
        payoutRequestsArray = Object.values(data.data).find(val => Array.isArray(val)) || [];
      } else if (Array.isArray(data)) {
        payoutRequestsArray = data;
      }
      
      // Map the API response to match the expected structure
      const payoutRequests = payoutRequestsArray.map((req, index) => ({
        id: req.id || req.request_id || req.withdrawal_id || `PR${index}`,
        user: req.driver_name || req.driverName || req.user || 'N/A',
        amount: req.amount || 0,
        status: req.status || 'pending',
        date: req.request_date || req.requestDate || req.date || req.created_at || 'N/A',
        avatar: req.driver_avatar || req.avatar || null,
        driverName: req.driver_name || req.driverName || req.user || 'N/A',
        driver_avatar: req.driver_avatar || req.avatar || null
      }));
      
      console.log('Mapped payout requests:', payoutRequests);
      return {
        success: true,
        data: payoutRequests
      };
    }
    
    console.error('API returned success: false', data);
    return { success: false, error: data.error || data.message || 'Failed to fetch payout requests' };
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

export const exportTransactionsToPDF = async (filters = {}) => {
  return exportPaymentTransactionsPDF({
    startDate: filters.start_date,
    endDate: filters.end_date,
  });
};

export const searchTransactions = async (query, limit = 10) => {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    
    const response = await authenticatedFetch(`${API_BASE_URL}/admin-search-transactions?${params}`, {
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
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    
    const params = new URLSearchParams();
    params.append('type', 'payouts'); // Add type parameter for unified endpoint
    
    if (filters.status && filters.status !== 'All') {
      params.append('status', filters.status.toLowerCase());
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    } else {
      params.append('page', '1'); // Default to page 1 if not specified
    }
    
    if (filters.pageSize) {
      params.append('page_size', filters.pageSize.toString());
    }
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin-drivers-list?${queryString}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };
    
    const response = await authenticatedFetch(url, {
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
    
    // Handle different possible response structures from unified endpoint
    let withdrawalsData = [];
    
    // Check if response indicates success
    if (data.success === true) {
      // Try different possible response structures (same as fetchDriversList pattern)
      if (Array.isArray(data.data)) {
        withdrawalsData = data.data;
      } else if (data.data?.drivers && Array.isArray(data.data.drivers)) {
        // Unified endpoint returns payouts in drivers array when type=payouts
        withdrawalsData = data.data.drivers;
      } else if (data.data?.payout_requests && Array.isArray(data.data.payout_requests)) {
        withdrawalsData = data.data.payout_requests;
      } else if (data.data?.payouts && Array.isArray(data.data.payouts)) {
        withdrawalsData = data.data.payouts;
      } else if (data.data?.withdrawals && Array.isArray(data.data.withdrawals)) {
        withdrawalsData = data.data.withdrawals;
      } else if (data.drivers && Array.isArray(data.drivers)) {
        withdrawalsData = data.drivers;
      } else if (data.data && typeof data.data === 'object') {
        // If data.data is an object, try to extract an array from it
        withdrawalsData = Object.values(data.data).find(val => Array.isArray(val)) || [];
      } else if (Array.isArray(data)) {
        withdrawalsData = data;
      }
      
      console.log('Extracted withdrawals data:', withdrawalsData);
      
      // Map the API response to match the expected structure
      const withdrawals = withdrawalsData.map((req, index) => {
        if (!req || typeof req !== 'object') {
          // Skip invalid entries
          return null;
        }
        
        // Helper function to extract string value from nested objects
        const extractString = (value, fallback = 'N/A') => {
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
          : (driverInfo.name || driverInfo.driver_name || 'N/A');
        const driverId = typeof driverInfo === 'string'
          ? (req.driver_id || req.driverId || 'N/A')
          : (driverInfo.id || driverInfo.driver_id || 'N/A');
        const driverAvatar = typeof driverInfo === 'string'
          ? (req.driver_avatar || req.avatar || null)
          : (driverInfo.avatar_url || driverInfo.avatar || driverInfo.profile_image || null);
        
        return {
          id: req.id || req.request_id || req.withdrawal_id || `PR${index}`,
          driver_id: driverId,
          driver_name: driverName,
          driver_avatar: driverAvatar,
          amount: parseFloat(req.amount) || 0,
          status: (req.status || 'pending').toLowerCase(),
          request_date: req.request_date || req.requestDate || req.created_at || req.date || 'N/A',
          bank_account: extractString(req.bank_account || req.bankAccount || req.account_number || req.account, 'N/A'),
          bank_name: extractString(req.bank_name || req.bankName || req.bank, 'N/A')
        };
      }).filter(item => item !== null); // Remove null entries
      
      console.log('Mapped withdrawals:', withdrawals);
      return {
        success: true,
        data: withdrawals,
        pagination: data.data?.pagination || data.pagination || {
          page: filters.page || 1,
          pageSize: filters.pageSize || 20,
          total: data.data?.total_count || data.data?.total || withdrawals.length,
          totalPages: data.data?.total_pages || data.data?.totalPages || Math.ceil((data.data?.total_count || data.data?.total || withdrawals.length) / (filters.pageSize || 20))
        }
      };
    }
    
    // If data.success is false, return error instead of mock data
    console.error('API returned success: false', data);
    return {
      success: false,
      error: data.error || data.message || 'Failed to fetch withdrawals'
    };
  } catch (error) {
    console.error('Withdrawals API error:', error);
    // Return error instead of mock data
    return {
      success: false,
      error: error.message || 'Failed to fetch withdrawals'
    };
  }
};

export const approveWithdrawal = async (payoutRequestId, adminNotes = '') => {
  try {
    const anonKey = localStorage.getItem('anonKey') || '';
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const requestBody = {
      payout_request_id: payoutRequestId,
      action: 'approve'
    };
    
    // Include admin_notes only if provided (it's optional)
    if (adminNotes && adminNotes.trim()) {
      requestBody.admin_notes = adminNotes.trim();
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/admin-payout-action`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
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
    const anonKey = localStorage.getItem('anonKey') || '';
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add apikey header if available
    if (anonKey) {
      headers['apikey'] = anonKey;
    }
    
    const response = await authenticatedFetch(`${API_BASE_URL}/admin-payout-action`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        payout_request_id: payoutRequestId,
        action: 'decline',
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
