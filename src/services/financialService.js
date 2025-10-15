// Mock Financial Service
const API_DELAY = 800;

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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockFinancialOverview
      });
    }, API_DELAY);
  });
};

export const fetchTransactions = async (filters = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredTransactions = [...mockTransactions];
      
      if (filters.type && filters.type !== 'All Types') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filters.type);
      }
      
      if (filters.status && filters.status !== 'All') {
        filteredTransactions = filteredTransactions.filter(t => t.status === filters.status);
      }
      
      resolve({
        success: true,
        data: filteredTransactions
      });
    }, API_DELAY);
  });
};

export const fetchPayoutRequests = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: mockPayoutRequests
      });
    }, API_DELAY);
  });
};

export const approvePayoutRequest = async (requestId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Payout request approved successfully'
      });
    }, API_DELAY);
  });
};

export const exportTransactionsCSV = (transactions) => {
  const headers = ['Transaction ID', 'Date', 'User/Driver', 'Type', 'Amount', 'Status'];
  const csvRows = [headers.join(',')];
  
  transactions.forEach(transaction => {
    const row = [
      transaction.id,
      transaction.date,
      `"${transaction.user}"`,
      transaction.type,
      transaction.amount.toFixed(2),
      transaction.status
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

