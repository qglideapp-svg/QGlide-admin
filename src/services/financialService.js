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
    const response = await fetch(`${API_BASE_URL}/admin-financial-overview`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const overview = data.data.financial_overview;
      return {
        success: true,
        data: {
          systemWalletBalance: overview.system_wallet_balance.value,
          commissions: {
            amount: overview.commissions_mtd.value,
            trend: overview.commissions_mtd.change_percent
          },
          pendingPayouts: {
            amount: overview.pending_payouts.value
          }
        }
      };
    }
    
    return { success: false, error: 'Failed to fetch financial overview' };
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

export const fetchPayoutRequests = async () => {
  // For now, return empty array since there's no specific API endpoint for payout requests
  // This matches the API response structure that returns empty arrays
  return {
    success: true,
    data: []
  };
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

