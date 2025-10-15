// Mock data for reports
const mockReports = [
  {
    id: 'RPT_001',
    name: 'Monthly Ride History',
    dateRange: '01 Oct 2025 - 31 Oct 2025',
    generatedOn: '01 Nov 2025, 09:15 AM',
    status: 'Ready',
    type: 'Ride History',
    format: 'CSV',
    downloadUrl: '#',
    createdAt: '2025-11-01T09:15:00Z'
  },
  {
    id: 'RPT_002',
    name: 'Q4 Driver Performance',
    dateRange: '01 Jul 2025 - 30 Sep 2025',
    generatedOn: '01 Oct 2025, 11:30 AM',
    status: 'Ready',
    type: 'Driver Performance',
    format: 'PDF',
    downloadUrl: '#',
    createdAt: '2025-10-01T11:30:00Z'
  },
  {
    id: 'RPT_003',
    name: 'Weekly Payment Transactions',
    dateRange: '20 Oct 2025 - 26 Oct 2025',
    generatedOn: '27 Oct 2025, 10:00 AM',
    status: 'Processing',
    type: 'Payment Transactions',
    format: 'XLSX',
    downloadUrl: '#',
    createdAt: '2025-10-27T10:00:00Z'
  },
  {
    id: 'RPT_004',
    name: 'Daily User Activity',
    dateRange: '06 Oct 2025',
    generatedOn: '07 Oct 2025, 08:00 AM',
    status: 'Failed',
    type: 'User Activity',
    format: 'CSV',
    downloadUrl: '#',
    createdAt: '2025-10-07T08:00:00Z'
  }
];

const reportTypes = [
  'Ride History',
  'Driver Performance',
  'Payment Transactions',
  'User Activity',
  'Financial Summary',
  'Analytics Overview'
];

const rideStatuses = [
  'All Statuses',
  'Completed',
  'Cancelled',
  'Active',
  'Pending'
];

const exportFormats = [
  'CSV',
  'PDF',
  'XLSX'
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all reports
export const fetchReports = async () => {
  await delay(500);
  return {
    success: true,
    data: mockReports
  };
};

// Generate a new report
export const generateReport = async (reportConfig) => {
  await delay(2000); // Simulate report generation time
  
  const newReport = {
    id: `RPT_${Date.now()}`,
    name: `${reportConfig.type} Report`,
    dateRange: reportConfig.dateRange,
    generatedOn: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    status: 'Processing',
    type: reportConfig.type,
    format: reportConfig.format,
    downloadUrl: '#',
    createdAt: new Date().toISOString()
  };
  
  // Add to mock data
  mockReports.unshift(newReport);
  
  return {
    success: true,
    data: newReport
  };
};

// Delete a report
export const deleteReport = async (reportId) => {
  await delay(300);
  
  const index = mockReports.findIndex(report => report.id === reportId);
  if (index !== -1) {
    mockReports.splice(index, 1);
    return {
      success: true,
      message: 'Report deleted successfully'
    };
  }
  
  return {
    success: false,
    error: 'Report not found'
  };
};

// Retry a failed report
export const retryReport = async (reportId) => {
  await delay(1000);
  
  const report = mockReports.find(report => report.id === reportId);
  if (report) {
    report.status = 'Processing';
    report.generatedOn = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Simulate processing completion after a delay
    setTimeout(() => {
      report.status = 'Ready';
    }, 3000);
    
    return {
      success: true,
      message: 'Report generation restarted'
    };
  }
  
  return {
    success: false,
    error: 'Report not found'
  };
};

// Download report
export const downloadReport = async (reportId) => {
  await delay(500);
  
  const report = mockReports.find(report => report.id === reportId);
  if (report && report.status === 'Ready') {
    // Simulate file download
    const blob = new Blob(['Mock report data'], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${report.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: 'Report downloaded successfully'
    };
  }
  
  return {
    success: false,
    error: 'Report not ready for download'
  };
};

// Get report configuration options
export const getReportOptions = async () => {
  await delay(200);
  return {
    success: true,
    data: {
      reportTypes,
      rideStatuses,
      exportFormats
    }
  };
};

// Search reports
export const searchReports = async (searchTerm) => {
  await delay(300);
  
  const filteredReports = mockReports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return {
    success: true,
    data: filteredReports
  };
};
