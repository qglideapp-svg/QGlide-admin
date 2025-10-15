// Mock data for Analytics & Reports

// Top metric cards
const mockMetrics = {
  averageFare: {
    value: 35.50,
    trend: '+2.1% this week',
    trendPositive: true,
  },
  peakHours: {
    value: '5-7 PM',
    description: 'Highest ride volume',
  },
  avgDriverRating: {
    value: 4.82,
    trend: '+0.05 this week',
    trendPositive: true,
  },
  totalDistance: {
    value: 24198,
    unit: 'km',
    description: 'Driven this week',
  },
  driverAcceptanceRate: {
    value: 92,
    unit: '%',
    trend: '+3% this week',
    trendPositive: true,
  },
};

// Rides by Region (Bar Chart Data)
const mockRidesByRegion = [
  { region: 'Doha', rides: 3240, color: '#FDE68A' },
  { region: 'Al Rayyan', rides: 2180, color: '#FCA5A5' },
  { region: 'Al Wakrah', rides: 1850, color: '#A7F3D0' },
  { region: 'Umm Salal', rides: 1420, color: '#BFDBFE' },
  { region: 'Al Khor', rides: 980, color: '#DDD6FE' },
];

// Rides by Vehicle Type (Pie Chart Data)
const mockRidesByVehicleType = [
  { type: 'Sedan', percentage: 45, rides: 4860, color: '#FDE68A' },
  { type: 'SUV', percentage: 30, rides: 3240, color: '#A7F3D0' },
  { type: 'Luxury', percentage: 15, rides: 1620, color: '#BFDBFE' },
  { type: 'Van', percentage: 10, rides: 1080, color: '#DDD6FE' },
];

// Driver Acceptance Rate by Hour (Bar Chart Data)
const mockAcceptanceRateByHour = [
  { hour: '6-9 AM', rate: 95, color: '#A7F3D0' },
  { hour: '9-12 PM', rate: 88, color: '#BFDBFE' },
  { hour: '12-3 PM', rate: 82, color: '#FED7AA' },
  { hour: '3-6 PM', rate: 90, color: '#DDD6FE' },
  { hour: '6-9 PM', rate: 98, color: '#A7F3D0' },
  { hour: '9-12 AM', rate: 85, color: '#FCA5A5' },
];

// Driver Performance Leaderboard
const mockDriverLeaderboard = [
  {
    id: 1,
    name: 'Ahmed Al-Sayed',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rides: 152,
    rating: 4.95,
    acceptanceRate: 98,
  },
  {
    id: 2,
    name: 'Yusuf Khan',
    avatar: 'https://i.pravatar.cc/150?img=13',
    rides: 148,
    rating: 4.91,
    acceptanceRate: 95,
  },
  {
    id: 3,
    name: 'Omar Hassan',
    avatar: 'https://i.pravatar.cc/150?img=14',
    rides: 135,
    rating: 4.88,
    acceptanceRate: 96,
  },
  {
    id: 4,
    name: 'Mohammed Ali',
    avatar: 'https://i.pravatar.cc/150?img=15',
    rides: 129,
    rating: 4.85,
    acceptanceRate: 89,
  },
];

// Revenue by Payment Type (Pie Chart Data)
const mockRevenueByPaymentType = [
  { type: 'Credit Card', percentage: 52, amount: 156000, color: '#FDE68A' },
  { type: 'Cash', percentage: 28, amount: 84000, color: '#A7F3D0' },
  { type: 'Wallet', percentage: 15, amount: 45000, color: '#BFDBFE' },
  { type: 'Other', percentage: 5, amount: 15000, color: '#DDD6FE' },
];

// Fetch analytics metrics
export const fetchAnalyticsMetrics = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockMetrics,
  };
};

// Fetch rides by region
export const fetchRidesByRegion = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockRidesByRegion,
  };
};

// Fetch rides by vehicle type
export const fetchRidesByVehicleType = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockRidesByVehicleType,
  };
};

// Fetch acceptance rate by hour
export const fetchAcceptanceRateByHour = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockAcceptanceRateByHour,
  };
};

// Fetch driver leaderboard
export const fetchDriverLeaderboard = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockDriverLeaderboard,
  };
};

// Fetch revenue by payment type
export const fetchRevenueByPaymentType = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    success: true,
    data: mockRevenueByPaymentType,
  };
};

// Export analytics report (downloads as CSV)
export const exportAnalyticsReport = () => {
  const csvContent = [
    ['Metric', 'Value'],
    ['Average Fare', `QAR ${mockMetrics.averageFare.value}`],
    ['Peak Hours', mockMetrics.peakHours.value],
    ['Avg Driver Rating', mockMetrics.avgDriverRating.value],
    ['Total Distance', `${mockMetrics.totalDistance.value} km`],
    ['Driver Acceptance Rate', `${mockMetrics.driverAcceptanceRate.value}%`],
    [''],
    ['Top Regions'],
    ...mockRidesByRegion.map(r => [r.region, `${r.rides} rides`]),
    [''],
    ['Vehicle Types'],
    ...mockRidesByVehicleType.map(v => [v.type, `${v.percentage}%`]),
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

