import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './DashboardView.css';
import logo from '../../assets/images/logo.webp';
import routeIcon from '../../assets/icons/route.png';
import moneyIcon from '../../assets/icons/money.png';
import activeIcon from '../../assets/icons/active.png';
import settingsIcon from '../../assets/icons/settings.png';
import checkIcon from '../../assets/icons/check.png';
import notificationsIcon from '../../assets/icons/notifications.png';
import { fetchDashboardData, fetchRidesAnalytics } from '../../services/dashboardService';
import { logoutUser } from '../../services/authService';
import { fetchFinancialOverview, fetchTransactions, fetchPayoutRequests, exportTransactionsCSV, fetchCashRides } from '../../services/financialService';
import { fetchSupportTickets, fetchTicketDetails, sendMessage, markAsResolved, markAsPending } from '../../services/supportService';
import { fetchAnalyticsReports, fetchAnalyticsMetrics, fetchRidesByRegion, fetchRidesByVehicleType, fetchAcceptanceRateByHour, fetchDriverLeaderboard, fetchRevenueByPaymentType, exportAnalyticsReport, exportAnalyticsAsJSON, exportRevenueData, exportSpecificSections } from '../../services/analyticsService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import AdminWithdrawModal from '../../components/modals/AdminWithdrawModal';
import { useLanguage } from '../../contexts/LanguageContext';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function DashboardView() {
  // v2.1 - Fix menu responsiveness after navigation
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  // Financial Management states
  const [financialOverview, setFinancialOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); // Store all transactions for filtering
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isFinancialLoading, setIsFinancialLoading] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('All Types');
  const [activeTransactionTab, setActiveTransactionTab] = useState('all'); // 'all' or 'cash'
  const [showAdminWithdrawModal, setShowAdminWithdrawModal] = useState(false);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  
  // Support states
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [isLoadingTicketDetails, setIsLoadingTicketDetails] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [supportListPollingInterval, setSupportListPollingInterval] = useState(null);
  
  // Analytics states
  const [analyticsMetrics, setAnalyticsMetrics] = useState(null);
  const [ridesByRegion, setRidesByRegion] = useState([]);
  const [ridesByVehicleType, setRidesByVehicleType] = useState([]);
  const [acceptanceRateByHour, setAcceptanceRateByHour] = useState([]);
  const [driverLeaderboard, setDriverLeaderboard] = useState([]);
  const [revenueByPaymentType, setRevenueByPaymentType] = useState([]);
  const [isAnalyticsDataLoading, setIsAnalyticsDataLoading] = useState(false);
  const [dateRange, setDateRange] = useState('Oct 1, 2025 - Oct 7, 2025');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('2025-10-01');
  const [tempEndDate, setTempEndDate] = useState('2025-10-07');
  
  // Export dropdown states
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState([
    'metrics',
    'ridesByRegion', 
    'ridesByVehicleType',
    'acceptanceRateByHour',
    'driverLeaderboard',
    'revenueByPaymentType'
  ]);
  const [isExporting, setIsExporting] = useState(false);

  // Reset all loading states when component mounts to ensure clean state
  useEffect(() => {
    setIsFinancialLoading(false);
    setIsSupportLoading(false);
    setIsAnalyticsDataLoading(false);
    
    // Check for section parameter in URL
    const section = searchParams.get('section');
    if (section && ['financial', 'support', 'analytics'].includes(section)) {
      setActiveSection(section);
    } else {
      setActiveSection('overview');
    }
    
    loadDashboardData();
    loadAnalyticsData();
  }, [searchParams]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);
  
  useEffect(() => {
    if (activeSection === 'financial') {
      loadFinancialData();
    } else if (activeSection === 'support') {
      loadSupportData();
    } else if (activeSection === 'analytics') {
      loadAnalyticsReportData();
    }
    
    // Stop polling when leaving support section
    if (activeSection !== 'support') {
      stopTicketPolling();
      stopSupportListPolling();
    } else if (activeSection === 'support') {
      startSupportListPolling();
    }
  }, [activeSection, ticketFilter, transactionFilter, activeTransactionTab]);


  // Cleanup polling intervals on component unmount
  useEffect(() => {
    return () => {
      stopTicketPolling();
      stopSupportListPolling();
    };
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown-container')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const loadAnalyticsData = async () => {
    setIsAnalyticsLoading(true);
    
    try {
      const result = await fetchRidesAnalytics(selectedTimeframe);
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        console.error('Analytics error:', result.error);
        // Don't show toast for analytics errors, just log them
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchDashboardData();
      
      if (result.success) {
        const overview = result.data.data.dashboard_overview;
        const transformedData = {
          totalRidesToday: overview.total_rides_last_7_days?.value || 0,
          ridesGrowth: overview.total_rides_last_7_days?.change_percent || 0,
          totalRevenue: overview.total_revenue_last_7_days?.value || 0,
          revenueGrowth: overview.total_revenue_last_7_days?.change_percent || 0,
          activeDrivers: overview.active_drivers?.value || 0,
          successRate: overview.ride_success_rate_last_7_days?.value || 0,
          successRateGrowth: overview.ride_success_rate_last_7_days?.change_percent || 0,
          totalCourierToday: overview.total_courier_last_7_days?.value || overview.total_courier_today?.value || 0,
          courierGrowth: overview.total_courier_last_7_days?.change_percent || overview.total_courier_today?.change_percent || 0,
          activeCourier: overview.active_courier?.value || 0,
          totalRentalsToday: overview.total_rentals_last_7_days?.value || overview.total_rentals_today?.value || 0,
          rentalsGrowth: overview.total_rentals_last_7_days?.change_percent || overview.total_rentals_today?.change_percent || 0,
          activeRentals: overview.active_rentals?.value || 0
        };
        setDashboardData(transformedData);
      } else {
        setError(result.error);
        setShowToast(true);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFinancialData = async () => {
    if (isFinancialLoading) return; // Prevent multiple simultaneous calls
    setIsFinancialLoading(true);
    
    try {
      // Fetch transactions or cash rides based on active tab
      const transactionsPromise = activeTransactionTab === 'cash' 
        ? fetchCashRides()
        : fetchTransactions({ type: transactionFilter });
      
      const [overviewResult, transactionsResult, payoutRequestsResult] = await Promise.all([
        fetchFinancialOverview(),
        transactionsPromise,
        fetchPayoutRequests('pending') // Fetch pending payout requests from the dedicated API
      ]);
      
      if (overviewResult.success) {
        setFinancialOverview(overviewResult.data);
      }
      
      if (transactionsResult.success) {
        const transactionsData = transactionsResult.data || [];
        setAllTransactions(transactionsData);
        setTransactions(transactionsData);
      }
      
      if (payoutRequestsResult.success) {
        // Limit to first 10 payout requests
        const payoutRequestsList = (payoutRequestsResult.data || []).slice(0, 10);
        setPayoutRequests(payoutRequestsList);
      }
    } catch (err) {
      console.error('Financial data error:', err);
    } finally {
      setIsFinancialLoading(false);
    }
  };
  
  const loadSupportData = async (silent = false) => {
    if (isSupportLoading && !silent) return; // Prevent multiple simultaneous calls
    if (!silent) setIsSupportLoading(true);
    
    try {
      // Fetch all and resolved in parallel; backend "all" often excludes resolved
      const [allTickets, resolvedTickets] = await Promise.all([
        fetchSupportTickets('all'),
        fetchSupportTickets('closed')
      ]);
      const byId = new Map();
      allTickets.forEach(t => byId.set(t.id, t));
      resolvedTickets.forEach(t => byId.set(t.id, t));
      const tickets = Array.from(byId.values());
      setSupportTickets(tickets);
      
      // If a ticket was already selected, refresh its data
      if (selectedTicket) {
        const updatedTicket = await fetchTicketDetails(selectedTicket.id);
        setSelectedTicket(updatedTicket);
      }
    } catch (err) {
      if (!silent) console.error('Support data error:', err);
    } finally {
      if (!silent) setIsSupportLoading(false);
    }
  };
  
  // Helper function to convert dateRange string to ISO format
  const parseDateRange = (dateRangeString) => {
    try {
      // Parse format like "Oct 1, 2025 - Oct 7, 2025"
      const parts = dateRangeString.split(' - ');
      if (parts.length !== 2) {
        throw new Error('Invalid date range format');
      }
      
      const startDateStr = parts[0].trim();
      const endDateStr = parts[1].trim();
      
      // Parse dates (assuming format: "Oct 1, 2025")
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // Set time to start and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    } catch (error) {
      console.error('Date parsing error:', error);
      // Fallback to last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  };

  const loadAnalyticsReportData = async () => {
    if (isAnalyticsDataLoading) return; // Prevent multiple simultaneous calls
    setIsAnalyticsDataLoading(true);
    
    try {
      console.log('🔄 LOADING ANALYTICS REPORT DATA:', {
        '📅 Date Range': dateRange,
        '⏰ Timestamp': new Date().toISOString()
      });

      // Parse dateRange to get start and end dates
      const { startDate, endDate } = parseDateRange(dateRange);
      
      console.log('📅 PARSED DATES:', {
        '📅 Start Date': startDate,
        '📅 End Date': endDate
      });

      // Call the unified analytics API
      const result = await fetchAnalyticsReports(startDate, endDate);
      
      if (result.success && result.data) {
        console.log('✅ ANALYTICS DATA LOADED:', {
          '📊 Has Metrics': !!result.data.metrics,
          '🗺️ Has Regions': !!result.data.ridesByRegion,
          '🚗 Has Vehicle Types': !!result.data.ridesByVehicleType,
          '⏰ Has Time Data': !!result.data.acceptanceRateByHour,
          '👑 Has Leaderboard': !!result.data.driverLeaderboard,
          '💰 Has Revenue Data': !!result.data.revenueByPaymentType,
          '🔍 Full Data': result.data
        });

        // Update all analytics state variables
        if (result.data.metrics) {
          setAnalyticsMetrics(result.data.metrics);
        }
        
        if (result.data.ridesByRegion) {
          setRidesByRegion(result.data.ridesByRegion);
        }
        
        if (result.data.ridesByVehicleType) {
          setRidesByVehicleType(result.data.ridesByVehicleType);
        }
        
        if (result.data.acceptanceRateByHour) {
          setAcceptanceRateByHour(result.data.acceptanceRateByHour);
        }
        
        if (result.data.driverLeaderboard) {
          setDriverLeaderboard(result.data.driverLeaderboard);
        }
        
        if (result.data.revenueByPaymentType) {
          setRevenueByPaymentType(result.data.revenueByPaymentType);
        }
      } else {
        console.error('❌ Analytics API failed:', result.error);
        // Keep existing data if API fails
      }
    } catch (err) {
      console.error('❌ Analytics report data error:', err);
      // Keep existing data if there's an error
    } finally {
      setIsAnalyticsDataLoading(false);
    }
  };

  // Date picker handlers
  const handleDateRangeClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateRangeApply = () => {
    // Convert dates to the expected format
    const startDate = new Date(tempStartDate);
    const endDate = new Date(tempEndDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };
    
    const newDateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    setDateRange(newDateRange);
    setShowDatePicker(false);
    
    // Reload analytics data with new date range
    loadAnalyticsReportData();
  };

  const handleDateRangeCancel = () => {
    setShowDatePicker(false);
  };

  // Export dropdown handlers
  const handleExportClick = () => {
    setShowExportDropdown(!showExportDropdown);
  };

  const handleExportOption = async (option) => {
    setShowExportDropdown(false);
    
    const { startDate, endDate } = parseDateRange(dateRange);
    
    switch (option) {
      case 'all-csv':
        await handleExportAllCSV(startDate, endDate);
        break;
      case 'specific':
        setShowSectionModal(true);
        break;
      case 'json':
        await handleExportJSON(startDate, endDate);
        break;
      case 'revenue-only':
        await handleExportRevenueOnly(startDate, endDate);
        break;
      default:
        break;
    }
  };

  const handleExportAllCSV = async (startDate, endDate) => {
    setIsExporting(true);
    try {
      const result = await exportAnalyticsReport(startDate, endDate);
      if (result.success) {
        showToastMessage('All data exported as CSV successfully', 'success');
      } else {
        showToastMessage(result.error || 'Failed to export data', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToastMessage('Failed to export data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async (startDate, endDate) => {
    setIsExporting(true);
    try {
      const result = await exportAnalyticsAsJSON(startDate, endDate);
      if (result.success) {
        showToastMessage('Data exported as JSON successfully', 'success');
      } else {
        showToastMessage(result.error || 'Failed to export JSON', 'error');
      }
    } catch (error) {
      console.error('JSON export error:', error);
      showToastMessage('Failed to export JSON', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportRevenueOnly = async (startDate, endDate) => {
    setIsExporting(true);
    try {
      const result = await exportRevenueData(startDate, endDate);
      if (result.success) {
        showToastMessage('Revenue data exported successfully', 'success');
      } else {
        showToastMessage(result.error || 'Failed to export revenue data', 'error');
      }
    } catch (error) {
      console.error('Revenue export error:', error);
      showToastMessage('Failed to export revenue data', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSpecific = () => {
    setShowExportDropdown(false);
    setShowSectionModal(true);
  };

  const handleSectionExport = async () => {
    setShowSectionModal(false);
    setIsExporting(true);
    
    try {
      const { startDate, endDate } = parseDateRange(dateRange);
      const result = await exportSpecificSections(startDate, endDate, selectedSections);
      
      if (result.success) {
        showToastMessage('Selected sections exported successfully', 'success');
      } else {
        showToastMessage(result.error || 'Failed to export sections', 'error');
      }
    } catch (error) {
      console.error('Section export error:', error);
      showToastMessage('Failed to export sections', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSectionToggle = (section) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = useCallback((navItem) => {
    // Reset any loading states before navigation
    setIsFinancialLoading(false);
    setIsSupportLoading(false);
    setIsAnalyticsDataLoading(false);
    
    if (navItem === 'financial') {
      setActiveSection('financial');
    } else if (navItem === 'support') {
      setActiveSection('support');
    } else if (navItem === 'analytics') {
      setActiveSection('analytics');
    } else if (navItem === 'overview') {
      setActiveSection('overview');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'courier-management') {
      navigate('/courier-management');
    } else if (navItem === 'rental-management') {
      navigate('/rental-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'reports') {
      navigate('/reports');
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'notifications') {
      navigate('/notifications');
    }
    // Add other navigation handlers as needed
  }, [navigate]);
  
  const handleExportCSV = () => {
    exportTransactionsCSV(transactions);
  };
  
  const handleTicketSelect = async (ticket) => {
    // Don't reload if the same ticket is clicked
    if (selectedTicket?.id === ticket.id) return;
    
    setIsLoadingTicketDetails(true);
    setSelectedTicket(null); // Clear previous ticket to show loading state
    
    try {
      const details = await fetchTicketDetails(ticket.id);
      setSelectedTicket(details);
      
      // Start polling for this ticket
      startTicketPolling(ticket.id);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setIsLoadingTicketDetails(false);
    }
  };

  // Start polling for ticket details every 2 seconds
  const startTicketPolling = (ticketId) => {
    // Clear any existing polling interval
    stopTicketPolling();
    
    console.log('🔄 Starting ticket polling for ticket:', ticketId);
    console.log('🔄 Polling interval will run every 2 seconds');
    
    const interval = setInterval(async () => {
      try {
        console.log('🔄 POLLING EXECUTED - Fetching ticket details for:', ticketId);
        const details = await fetchTicketDetails(ticketId);
        console.log('🔄 POLLING RESULT:', {
          '🆔 Ticket ID': details.id,
          '💬 Conversation Length': details.conversation ? details.conversation.length : 0,
          '💬 Conversation': details.conversation,
          '⏰ Poll Time': new Date().toISOString()
        });
        
        setSelectedTicket(prevTicket => {
          // Only update if ticket ID matches (user hasn't switched tickets)
          if (prevTicket && prevTicket.id === ticketId) {
            console.log('🔄 UPDATING TICKET STATE:', {
              '📊 Previous Conversation Length': prevTicket.conversation ? prevTicket.conversation.length : 0,
              '📊 New Conversation Length': details.conversation ? details.conversation.length : 0,
              '📊 Conversation Changed': (prevTicket.conversation ? prevTicket.conversation.length : 0) !== (details.conversation ? details.conversation.length : 0),
              '⏰ Update Time': new Date().toISOString()
            });
            return details;
          } else {
            console.log('🔄 SKIPPING UPDATE - Ticket ID mismatch:', {
              '📊 Previous Ticket ID': prevTicket ? prevTicket.id : 'No previous ticket',
              '📊 Current Ticket ID': ticketId,
              '⏰ Skip Time': new Date().toISOString()
            });
          }
          return prevTicket;
        });
      } catch (err) {
        console.error('❌ POLLING ERROR:', err);
        // Stop polling on error
        stopTicketPolling();
      }
    }, 2000); // Poll every 2 seconds
    
    console.log('✅ POLLING INTERVAL SET:', interval);
    setPollingInterval(interval);
  };

  // Stop polling for ticket details
  const stopTicketPolling = () => {
    if (pollingInterval) {
      console.log('🛑 STOPPING TICKET POLLING:', {
        '🔄 Interval ID': pollingInterval,
        '⏰ Stop Time': new Date().toISOString(),
        '📍 Call Stack': new Error().stack
      });
      clearInterval(pollingInterval);
      setPollingInterval(null);
    } else {
      console.log('ℹ️ No polling interval to stop');
    }
  };

  // Poll support tickets list every 5 seconds when on support section
  const startSupportListPolling = () => {
    stopSupportListPolling();
    const interval = setInterval(() => {
      loadSupportData(true);
    }, 5000);
    setSupportListPollingInterval(interval);
  };

  const stopSupportListPolling = () => {
    if (supportListPollingInterval) {
      clearInterval(supportListPollingInterval);
      setSupportListPollingInterval(null);
    }
  };
  
  const handleSendMessage = async () => {
    if (!replyMessage.trim() || !selectedTicket || isSendingMessage) return;
    
    setIsSendingMessage(true);
    const messageToSend = replyMessage.trim();
    
    try {
      await sendMessage(selectedTicket.id, messageToSend);
      setReplyMessage('');
      
      // Refresh the ticket details to show the new message immediately
      const updatedTicket = await fetchTicketDetails(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      
      // Restart polling to continue getting updates
      startTicketPolling(selectedTicket.id);
    } catch (err) {
      console.error('Error sending message:', err);
      // Optionally show error toast here
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  const handleMarkAsResolved = async () => {
    if (!selectedTicket) return;
    
    try {
      await markAsResolved(selectedTicket.id, selectedTicket.priority);
      
      // Stop polling since ticket is resolved
      stopTicketPolling();
      
      // Refresh support data
      await loadSupportData();
      
      // Clear selected ticket if it was resolved
      setSelectedTicket(null);
    } catch (err) {
      console.error('Error marking ticket as resolved:', err);
    }
  };

  const handleMarkAsPending = async () => {
    if (!selectedTicket) return;
    
    try {
      await markAsPending(selectedTicket.id, selectedTicket.priority);
      
      // Refresh support data
      await loadSupportData();
      
      // Update selected ticket status and continue polling
      setSelectedTicket(prev => prev ? { ...prev, status: 'pending' } : null);
      
      // Continue polling for pending tickets
      startTicketPolling(selectedTicket.id);
    } catch (err) {
      console.error('Error marking ticket as pending:', err);
    }
  };

  const closeToast = () => {
    setShowToast(false);
    setError(null);
  };

  const showToastMessage = (message, type = 'error') => {
    setError(message);
    setShowToast(true);
  };

  const handleAdminWithdraw = async (withdrawData) => {
    setIsProcessingWithdraw(true);
    try {
      // TODO: Implement API call for admin withdrawal
      console.log('Admin withdraw data:', withdrawData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToastMessage('Withdrawal request submitted successfully', 'success');
      setShowAdminWithdrawModal(false);
      
      // Reload financial overview to update balance
      const overviewResult = await fetchFinancialOverview();
      if (overviewResult.success) {
        setFinancialOverview(overviewResult.data);
      }
    } catch (err) {
      console.error('Admin withdraw error:', err);
      showToastMessage('Failed to submit withdrawal request', 'error');
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('common.confirmLogout'))) {
      try {
        const result = await logoutUser();
        
        if (result.success) {
          navigate('/login');
        } else {
          // Even if API fails, still redirect to login since token is cleared
          navigate('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect to login
        navigate('/login');
      }
    }
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'QAR 0';
    // Handle object with value property
    if (typeof amount === 'object' && amount.value !== undefined) {
      const numValue = typeof amount.value === 'number' ? amount.value : parseFloat(amount.value);
      if (isNaN(numValue)) return 'QAR 0';
      return `QAR ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Handle number
    if (typeof amount === 'number') {
      return `QAR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Handle string
    if (typeof amount === 'string') {
      const numValue = parseFloat(amount);
      if (isNaN(numValue)) return 'QAR 0';
      return `QAR ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return 'QAR 0';
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return value;
    return `${value}%`;
  };

  // Helper function to create SVG pie chart path
  const createPieSlice = (startAngle, endAngle, radius = 80) => {
    const centerX = 100;
    const centerY = 100;
    
    const startRadians = (startAngle - 90) * (Math.PI / 180);
    const endRadians = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startRadians);
    const y1 = centerY + radius * Math.sin(startRadians);
    const x2 = centerX + radius * Math.cos(endRadians);
    const y2 = centerY + radius * Math.sin(endRadians);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className={`dash grid-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} active={activeSection === 'overview'} onClick={() => handleNavClick('overview')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label={t('navigation.userManagement')} onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label={t('navigation.financial')} active={activeSection === 'financial'} onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label={t('navigation.withdrawals')} onClick={() => handleNavClick('withdrawals')} />
          <NavItem icon="notifications" label="Notifications" onClick={() => handleNavClick('notifications')} />
          <NavItem icon="support_agent" label={t('navigation.support')} active={activeSection === 'support'} onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label={t('navigation.analytics')} active={activeSection === 'analytics'} onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label={t('navigation.reports')} onClick={() => handleNavClick('reports')} />
        </nav>

        <div className="sfoot">
          <button className="settings" type="button" onClick={() => navigate('/settings')}>
            <img src={settingsIcon} alt="settings" className="kimg" />
            <span>{t('common.settings')}</span>
          </button>
          <div className="urow">
            <img src="https://i.pravatar.cc/80?img=5" alt="Amina" className="avatar" />
            <div className="meta">
              <div className="name">QGlide Admin</div>
              <div className="role">Super Admin</div>
            </div>
            <button className="logout-btn-sidebar" aria-label={t('common.logout')} onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {activeSection === 'overview' ? (
          <>
        <header className="top">
          <div className="titles">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
            <h1>{t('dashboard.title')}</h1>
            <p className="sub">{t('dashboard.overview')}</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder={t('common.search')} />
            </div>
            <button className="chip on">EN</button>
            <button className="chip">AR</button>
            <ThemeToggle />
            <button className="ibtn" aria-label={t('common.settings')} onClick={() => navigate('/settings')}><img src={settingsIcon} alt="settings" className="kimg" /></button>
            <button className="ibtn" aria-label={t('common.notifications')}><img src={notificationsIcon} alt="notifications" className="kimg" /><i className="dot" /></button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <section className="kpis">
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.ridesToday')}</span><span className="kbadge blue"><img src={routeIcon} alt="route" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.totalRidesToday ? formatNumber(dashboardData.totalRidesToday) : '0'}</div>
                <div className={`ksub ${dashboardData?.ridesGrowth && dashboardData.ridesGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.ridesGrowth ? `${dashboardData.ridesGrowth >= 0 ? '+' : ''}${dashboardData.ridesGrowth}% vs yesterday` : t('common.noData')}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.totalRevenue')}</span><span className="kbadge green"><img src={moneyIcon} alt="money" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.totalRevenue ? formatCurrency(dashboardData.totalRevenue) : 'QAR 0'}</div>
                <div className={`ksub ${dashboardData?.revenueGrowth && dashboardData.revenueGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.revenueGrowth ? `${dashboardData.revenueGrowth >= 0 ? '+' : ''}${dashboardData.revenueGrowth}% vs yesterday` : t('common.noData')}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.activeDrivers')}</span><span className="kbadge yellow"><img src={activeIcon} alt="active" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.activeDrivers ? formatNumber(dashboardData.activeDrivers) : '0'}</div>
                <div className="ksub">{t('common.online')}</div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.rideSuccessRate')}</span><span className="kbadge purple"><img src={checkIcon} alt="check" className="kimg"/></span></div>
                <div className="kmain">{dashboardData?.successRate ? formatPercentage(dashboardData.successRate) : '0%'}</div>
                <div className={`ksub ${dashboardData?.successRateGrowth && dashboardData.successRateGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.successRateGrowth ? `${dashboardData.successRateGrowth >= 0 ? '+' : ''}${dashboardData.successRateGrowth}% vs yesterday` : t('common.noData')}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.totalCourierToday')}</span><span className="kbadge blue"><span className="material-symbols-outlined">local_shipping</span></span></div>
                <div className="kmain">{dashboardData?.totalCourierToday ? formatNumber(dashboardData.totalCourierToday) : '0'}</div>
                <div className={`ksub ${dashboardData?.courierGrowth && dashboardData.courierGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.courierGrowth ? `${dashboardData.courierGrowth >= 0 ? '+' : ''}${dashboardData.courierGrowth}% vs yesterday` : t('common.noData')}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.activeCourier')}</span><span className="kbadge yellow"><span className="material-symbols-outlined">delivery_dining</span></span></div>
                <div className="kmain">{dashboardData?.activeCourier ? formatNumber(dashboardData.activeCourier) : '0'}</div>
                <div className="ksub">{t('common.active')}</div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.totalRentalsToday')}</span><span className="kbadge blue"><span className="material-symbols-outlined">car_rental</span></span></div>
                <div className="kmain">{dashboardData?.totalRentalsToday ? formatNumber(dashboardData.totalRentalsToday) : '0'}</div>
                <div className={`ksub ${dashboardData?.rentalsGrowth && dashboardData.rentalsGrowth >= 0 ? 'good' : 'bad'}`}>
                  {dashboardData?.rentalsGrowth ? `${dashboardData.rentalsGrowth >= 0 ? '+' : ''}${dashboardData.rentalsGrowth}% vs yesterday` : t('common.noData')}
                </div>
              </div>
              <div className="kcard">
                <div className="khead"><span>{t('dashboard.activeRentals')}</span><span className="kbadge yellow"><span className="material-symbols-outlined">directions_car</span></span></div>
                <div className="kmain">{dashboardData?.activeRentals ? formatNumber(dashboardData.activeRentals) : '0'}</div>
                <div className="ksub">{t('common.active')}</div>
              </div>
            </section>
          )}

          <section className="grid2">
            <div className="panel stretch">
              <div className="phead">
                <h3>{t('dashboard.ridesOverTime')}</h3>
                <div className="filters">
                  <button 
                    className={`chip ${selectedTimeframe === 'week' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('week')}
                  >
                    {t('common.week')}
                  </button>
                  <button 
                    className={`chip ${selectedTimeframe === 'month' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('month')}
                  >
                    {t('common.month')}
                  </button>
                  <button 
                    className={`chip ${selectedTimeframe === 'year' ? 'on' : ''}`}
                    onClick={() => handleTimeframeChange('year')}
                  >
                    {t('common.year')}
                  </button>
                </div>
              </div>
              <div className="pbody">
                {isAnalyticsLoading ? (
                  <div className="analytics-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                  </div>
                ) : analyticsData ? (
                  <div className="analytics-content">
                    {analyticsData.chartData && analyticsData.chartData.length > 0 ? (
                      <div className="chart-placeholder">
                        <p>{t('dashboard.chartDataAvailable')}: {analyticsData.chartData.length} {t('dashboard.dataPoints')}</p>
                        <div className="analytics-summary">
                          <div className="summary-item">
                            <span className="label">{t('dashboard.totalRides')}:</span>
                            <span className="value">{analyticsData.totalRides ? formatNumber(analyticsData.totalRides) : 'N/A'}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">{t('dashboard.averageDaily')}:</span>
                            <span className="value">{analyticsData.averageDaily ? formatNumber(analyticsData.averageDaily) : 'N/A'}</span>
                          </div>
                          <div className="summary-item">
                            <span className="label">{t('dashboard.peakDay')}:</span>
                            <span className="value">{analyticsData.peakDay || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-data">
                        <p>{t('dashboard.noAnalyticsData')} {selectedTimeframe}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>{t('dashboard.failedToLoadAnalytics')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="panel">
              <div className="phead">
                <h3>{t('dashboard.liveDriverMap')}</h3>
                <button className="link">{t('common.viewAll')}</button>
              </div>
              <div className="map" />
            </div>
          </section>
        </div>
          </>
        ) : activeSection === 'financial' ? (
          <>
            <header className="top financial-header">
              <div className="titles">
                <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h1>{t('financial.financialManagement')}</h1>
                  <p className="sub">{t('financial.manageTransactions')}</p>
                </div>
              </div>
              <div className="acts">
                <div className="search">
                  <span className="material-symbols-outlined">search</span>
                  <input placeholder={t('financial.searchTransactions')} />
                </div>
                <button className="chip on">EN</button>
                <button className="chip">AR</button>
                <button className="ibtn" aria-label="dark-mode">
                  <span className="material-symbols-outlined">dark_mode</span>
                </button>
                <button className="ibtn" aria-label={t('common.notifications')}>
                  <img src={notificationsIcon} alt="notifications" className="kimg" />
                  <i className="dot" />
                </button>
              </div>
            </header>

            <div className="container financial-section">
              {isFinancialLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : (
                <>
                  <section className="metric-cards">
                    <div className="metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('financial.systemWalletBalance')}</span>
                          <span className="metric-description">{t('financial.totalAcrossWallets')}</span>
                        </div>
                        <div className="metric-icon blue">
                          <span className="material-symbols-outlined">account_balance</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {financialOverview ? formatCurrency(financialOverview.systemWalletBalance) : 'QAR 0'}
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('financial.commissionsMTD')}</span>
                          <span className="metric-trend positive">
                            {(() => {
                              const trend = financialOverview?.commissions?.trend;
                              if (!trend) return '';
                              // Extract numeric value if it's an object
                              const trendValue = typeof trend === 'number' 
                                ? trend 
                                : (typeof trend === 'object' && trend.value !== undefined 
                                  ? (typeof trend.value === 'number' ? trend.value : parseFloat(trend.value))
                                  : parseFloat(trend));
                              if (isNaN(trendValue)) return '';
                              return `+${trendValue}% vs last month`;
                            })()}
                          </span>
                        </div>
                        <div className="metric-icon green">
                          <span className="material-symbols-outlined">percent</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {financialOverview?.commissions?.amount ? formatCurrency(financialOverview.commissions.amount) : 'QAR 0'}
                      </div>
                      <div className="metric-actions">
                        <button 
                          className="admin-withdraw-btn"
                          onClick={() => setShowAdminWithdrawModal(true)}
                          title={t('financial.adminWithdraw')}
                        >
                          <span className="material-symbols-outlined">account_balance_wallet</span>
                          {t('financial.adminWithdraw')}
                        </button>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('financial.pendingPayouts')}</span>
                          <span className="metric-description">{t('financial.awaitingApproval')}</span>
                        </div>
                        <div className="metric-icon orange">
                          <span className="material-symbols-outlined">hourglass_empty</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {financialOverview?.pendingPayouts?.amount ? formatCurrency(financialOverview.pendingPayouts.amount) : 'QAR 0'}
                      </div>
                    </div>
                  </section>

                  <section className="financial-grid">
                    <div className="transactions-panel">
                      <div className="panel-header">
                        <div className="panel-header-left">
                          <h3>{t('financial.allTransactions')}</h3>
                          <div className="transaction-tabs">
                            <button
                              className={`tab-btn ${activeTransactionTab === 'all' ? 'active' : ''}`}
                              onClick={() => setActiveTransactionTab('all')}
                            >
                              All Transactions
                            </button>
                            <button
                              className={`tab-btn ${activeTransactionTab === 'cash' ? 'active' : ''}`}
                              onClick={() => setActiveTransactionTab('cash')}
                            >
                              Cash Rides
                            </button>
                          </div>
                        </div>
                        <div className="panel-controls">
                          <div className="date-picker-wrapper">
                            <input type="text" placeholder="mm/dd/yyyy" className="date-picker" />
                            <span className="material-symbols-outlined">calendar_today</span>
                          </div>
                          <select 
                            className="type-filter"
                            value={transactionFilter}
                            onChange={(e) => setTransactionFilter(e.target.value)}
                          >
                            <option>{t('financial.allTypes')}</option>
                            <option>{t('financial.fare')}</option>
                            <option>{t('financial.topUp')}</option>
                            <option>{t('financial.payout')}</option>
                            <option>{t('financial.refund')}</option>
                          </select>
                          <button className="export-btn" onClick={handleExportCSV}>
                            {t('common.export')} CSV
                          </button>
                        </div>
                      </div>
                      <div className="transactions-table-wrapper">
                        <table className="transactions-table">
                          <thead>
                            <tr>
                              <th>{t('financial.transactionId')}</th>
                              <th>{t('financial.date')}</th>
                              <th>{t('financial.userDriver')}</th>
                              <th>{t('financial.type')}</th>
                              <th>{t('financial.amount')}</th>
                              <th>{t('financial.status')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="no-transactions">
                                  <div className="no-transactions-content">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    <p>{activeTransactionTab === 'cash' ? 'No cash rides found' : 'No transactions found'}</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              transactions.map((transaction) => (
                                <tr key={transaction.id}>
                                  <td className="transaction-id">{transaction.id}</td>
                                  <td>{transaction.date}</td>
                                  <td>{transaction.user}</td>
                                  <td>
                                    <span className={`type-pill ${transaction.type.toLowerCase()}`}>
                                      {transaction.type}
                                    </span>
                                  </td>
                                  <td className="amount">{formatCurrency(transaction.amount)}</td>
                                  <td>
                                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                                      <span className="material-symbols-outlined">
                                        {transaction.status === 'Completed' ? 'check_circle' : 'schedule'}
                                      </span>
                                      {transaction.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="payouts-panel">
                      <div className="panel-header">
                        <h3>{t('financial.payoutRequests')}</h3>
                        <button 
                          className="view-all-btn"
                          onClick={() => navigate('/withdrawals')}
                          title={t('financial.viewAllWithdrawals')}
                        >
                          {t('common.viewAll')}
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                      <div className="payout-list">
                        {payoutRequests.length === 0 ? (
                          <div className="no-payouts">
                            <span className="material-symbols-outlined">inbox</span>
                            <p>{t('financial.noPayoutRequests')}</p>
                          </div>
                        ) : (
                          payoutRequests.map((payout) => {
                            const status = payout.status?.toLowerCase() || 'pending';
                            const statusClass = status === 'completed' ? 'completed' : 
                                               status === 'approved' ? 'approved' : 
                                               status === 'rejected' ? 'rejected' : 'pending';
                            
                            // Use driverName from API response, fallback to user field
                            const driverName = payout.driverName || payout.user?.replace(' (Driver)', '') || payout.user || 'Unknown Driver';
                            
                            // Use avatar from API response, or generate one based on driver name
                            const avatarUrl = payout.avatar || payout.driver_avatar || (() => {
                              const nameHash = driverName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                              return `https://i.pravatar.cc/80?img=${(nameHash % 70) + 1}`;
                            })();
                            
                            return (
                              <div 
                                key={payout.id} 
                                className={`payout-item ${statusClass}`}
                                onClick={() => navigate('/withdrawals')}
                                style={{ cursor: 'pointer' }}
                              >
                                <img 
                                  src={avatarUrl} 
                                  alt={driverName} 
                                  className="payout-avatar" 
                                />
                                <div className="payout-info">
                                  <div className="payout-name">{driverName}</div>
                                  <div className="payout-amount">{formatCurrency(payout.amount)}</div>
                                  <div className="payout-status">
                                    <span className={`status-badge ${statusClass}`}>
                                      {payout.status || 'Pending'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        ) : activeSection === 'support' ? (
          <>
            <header className="top support-header">
              <div className="titles">
                <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h1>{t('support.supportTicketCenter')}</h1>
                  <p className="sub">{t('support.manageInquiries')}</p>
                </div>
              </div>
              <div className="acts">
                <div className="search">
                  <span className="material-symbols-outlined">search</span>
                  <input placeholder={t('support.searchTickets')} />
                </div>
                <button className="chip on">EN</button>
                <button className="chip">AR</button>
                <button className="ibtn" aria-label={t('common.notifications')}>
                  <img src={notificationsIcon} alt="notifications" className="kimg" />
                  <i className="dot" />
                </button>
              </div>
            </header>

            <div className="container support-section">
              {isSupportLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>{t('support.loadingSupportTickets')}</p>
                </div>
              ) : (
                <div className="support-layout">
                  {/* Left Sidebar - Ticket List */}
                  <div className="tickets-sidebar">
                    <div className="ticket-filters">
                      <button 
                        className={`filter-tab ${ticketFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTicketFilter('all')}
                      >
                        {t('support.allTickets')}
                        <span className="count">{supportTickets.length}</span>
                      </button>
                      <button 
                        className={`filter-tab ${ticketFilter === 'open' ? 'active' : ''}`}
                        onClick={() => setTicketFilter('open')}
                      >
                        {t('support.openTickets')}
                        <span className="count">{supportTickets.filter(t => t.status === 'open').length}</span>
                      </button>
                      <button 
                        className={`filter-tab ${ticketFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setTicketFilter('pending')}
                      >
                        {t('common.pending')}
                        <span className="count">{supportTickets.filter(t => t.status === 'pending').length}</span>
                      </button>
                      <button 
                        className={`filter-tab ${ticketFilter === 'closed' ? 'active' : ''}`}
                        onClick={() => setTicketFilter('closed')}
                      >
                        {t('support.resolvedTickets')}
                        <span className="count">{supportTickets.filter(t => t.status === 'closed' || t.status === 'resolved').length}</span>
                      </button>
                    </div>

                    <div className="tickets-list">
                      {supportTickets
                        .filter((ticket) => {
                          if (ticketFilter === 'all') return true;
                          if (ticketFilter === 'open') return ticket.status === 'open';
                          if (ticketFilter === 'pending') return ticket.status === 'pending';
                          if (ticketFilter === 'closed') return ticket.status === 'closed' || ticket.status === 'resolved';
                          return true;
                        })
                        .map((ticket) => (
                        <div 
                          key={ticket.id}
                          className={`ticket-item ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                          onClick={() => handleTicketSelect(ticket)}
                        >
                          <div className="ticket-header-row">
                            <span className="ticket-id">{ticket.id}</span>
                            <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
                          </div>
                          <div className="ticket-title">{ticket.title}</div>
                          <div className="ticket-meta">
                            {typeof ticket.requester === 'string' && ticket.requester.trim() && ticket.requester.trim().toLowerCase() !== 'unknown' ? (
                              <span className="requester">{ticket.requester}</span>
                            ) : null}
                            <span className="date">{ticket.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Ticket Details & Conversation */}
                  <div className="ticket-details">
                    {isLoadingTicketDetails ? (
                      <div className="ticket-loading-container">
                        <div className="loading-spinner"></div>
                        <p>{t('support.loadingTicketDetails') || 'Loading ticket details...'}</p>
                      </div>
                    ) : selectedTicket ? (
                      <>
                        <div className="ticket-details-header">
                          <div className="ticket-title-section">
                            <h2>{selectedTicket.title}</h2>
                            <div className="ticket-status-container">
                              <span className={`status-badge ${selectedTicket.status}`}>
                                {selectedTicket.status}
                              </span>
                              {pollingInterval && (
                                <span className="polling-indicator" title="Auto-refreshing messages">
                                  <span className="material-symbols-outlined">sync</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ticket-actions">
                            {selectedTicket.status === 'open' && (
                              <>
                                <button className="resolve-btn" onClick={handleMarkAsResolved}>
                                  <span className="material-symbols-outlined">check_circle</span>
                                  {t('support.markAsResolved')}
                                </button>
                                <button className="pending-btn" onClick={handleMarkAsPending}>
                                  <span className="material-symbols-outlined">schedule</span>
                                  {t('support.markAsPending')}
                                </button>
                              </>
                            )}
                            {selectedTicket.status === 'pending' && (
                              <button className="resolve-btn" onClick={handleMarkAsResolved}>
                                <span className="material-symbols-outlined">check_circle</span>
                                {t('support.markAsResolved')}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="ticket-info-bar">
                          <div className="info-item">
                            <span className="label">Ticket ID:</span>
                            <span className="value">{selectedTicket.id}</span>
                          </div>
                          {typeof selectedTicket.requester === 'string' && selectedTicket.requester.trim() && selectedTicket.requester.trim().toLowerCase() !== 'unknown' ? (
                            <div className="info-item">
                              <span className="label">Requester:</span>
                              <span className="value">{selectedTicket.requester}</span>
                            </div>
                          ) : null}
                          <div className="info-item">
                            <span className="label">Priority:</span>
                            <span className={`priority-badge ${selectedTicket.priority}`}>
                              {selectedTicket.priority}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Date:</span>
                            <span className="value">{selectedTicket.date}</span>
                          </div>
                        </div>

                        <div className="conversation-area">
                          <div className="conversation-thread">
                            {selectedTicket.conversation.map((msg) => (
                              <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                                <div className="message-header">
                                  <span className="sender-name">{msg.senderName}</span>
                                  <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="message-content">{msg.message}</div>
                              </div>
                            ))}
                          </div>

                          {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                            <div className="reply-area">
                              <textarea
                                className="reply-input"
                                placeholder={t('support.enterMessage')}
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                              />
                              <button 
                                className="send-btn" 
                                onClick={handleSendMessage}
                                disabled={!replyMessage.trim() || isSendingMessage}
                              >
                                {isSendingMessage ? (
                                  <>
                                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                                      hourglass_empty
                                    </span>
                                    {t('support.sending') || 'Sending...'}
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined">send</span>
                                    {t('support.send')}
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="no-ticket-selected">
                        <span className="material-symbols-outlined">support_agent</span>
                        <p>{t('support.selectTicket')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeSection === 'analytics' ? (
          <>
            <header className="top analytics-header">
              <div className="titles">
                <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div>
                  <h1>{t('analytics.analyticsReports')}</h1>
                  <p className="sub">{t('analytics.deepDiveMetrics')}</p>
                </div>
              </div>
              <div className="acts">
                <div className="date-range-picker-container">
                  <div className="date-range-display" onClick={handleDateRangeClick}>
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>{dateRange}</span>
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                  
                  {showDatePicker && (
                    <div className="date-picker-dropdown">
                      <div className="date-picker-header">
                        <h4>{t('analytics.selectDateRange')}</h4>
                        <button className="close-btn" onClick={handleDateRangeCancel}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                      <div className="date-inputs">
                        <div className="date-input-group">
                          <label>{t('analytics.startDate')}</label>
                          <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            className="date-input"
                          />
                        </div>
                        <div className="date-input-group">
                          <label>{t('analytics.endDate')}</label>
                          <input
                            type="date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            className="date-input"
                          />
                        </div>
                      </div>
                      <div className="date-picker-actions">
                        <button className="cancel-btn" onClick={handleDateRangeCancel}>
                          {t('common.cancel')}
                        </button>
                        <button className="apply-btn" onClick={handleDateRangeApply}>
                          {t('common.apply')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="export-dropdown-container">
                  <button 
                    className="export-report-btn" 
                    onClick={handleExportClick}
                    disabled={isExporting}
                  >
                    <span className="material-symbols-outlined">
                      {isExporting ? 'hourglass_empty' : 'download'}
                    </span>
                    {isExporting ? t('analytics.exporting') : t('analytics.exportReport')}
                    <span className="material-symbols-outlined">expand_more</span>
                  </button>
                  
                  {showExportDropdown && (
                    <div className="export-dropdown-menu">
                      <div 
                        className="export-dropdown-item"
                        onClick={() => handleExportOption('all-csv')}
                      >
                        <span className="material-symbols-outlined">table_chart</span>
                        {t('analytics.exportAllCSV')}
                      </div>
                      <div 
                        className="export-dropdown-item"
                        onClick={() => handleExportOption('specific')}
                      >
                        <span className="material-symbols-outlined">checklist</span>
                        {t('analytics.exportSpecificSections')}
                      </div>
                      <div 
                        className="export-dropdown-item"
                        onClick={() => handleExportOption('json')}
                      >
                        <span className="material-symbols-outlined">code</span>
                        {t('analytics.exportAsJSON')}
                      </div>
                      <div 
                        className="export-dropdown-item"
                        onClick={() => handleExportOption('revenue-only')}
                      >
                        <span className="material-symbols-outlined">payments</span>
                        {t('analytics.exportRevenueOnly')}
                      </div>
                    </div>
                  )}
                </div>
                <button className="ibtn" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <button className="ibtn" aria-label={t('common.notifications')}>
                  <img src={notificationsIcon} alt="notifications" className="kimg" />
                  <i className="dot" />
                </button>
              </div>
            </header>

            <div className="container analytics-section">
              {isAnalyticsDataLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>{t('common.loading')}</p>
                </div>
              ) : (
                <>
                  {/* Top 5 Metric Cards */}
                  <section className="analytics-metrics">
                    <div className="analytics-metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('analytics.averageFare')}</span>
                          <span className="metric-trend positive">
                            {analyticsMetrics?.averageFare?.trend || ''}
                          </span>
                        </div>
                        <div className="metric-icon green">
                          <span className="material-symbols-outlined">payments</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        QAR {analyticsMetrics?.averageFare?.value || '0.00'}
                      </div>
                    </div>

                    <div className="analytics-metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('analytics.peakHours')}</span>
                          <span className="metric-description">
                            {analyticsMetrics?.peakHours?.description || ''}
                          </span>
                        </div>
                        <div className="metric-icon purple">
                          <span className="material-symbols-outlined">schedule</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {analyticsMetrics?.peakHours?.value || ''}
                      </div>
                    </div>

                    <div className="analytics-metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('analytics.avgDriverRating')}</span>
                          <span className="metric-trend positive">
                            {analyticsMetrics?.avgDriverRating?.trend || ''}
                          </span>
                        </div>
                        <div className="metric-icon yellow">
                          <span className="material-symbols-outlined">star</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {analyticsMetrics?.avgDriverRating?.value || '0.00'}
                      </div>
                    </div>

                    <div className="analytics-metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('analytics.totalDistance')}</span>
                          <span className="metric-description">
                            {analyticsMetrics?.totalDistance?.description || ''}
                          </span>
                        </div>
                        <div className="metric-icon blue">
                          <span className="material-symbols-outlined">route</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {analyticsMetrics?.totalDistance?.value ? formatNumber(analyticsMetrics.totalDistance.value) : '0'} km
                      </div>
                    </div>

                    <div className="analytics-metric-card">
                      <div className="metric-header">
                        <div className="metric-info">
                          <span className="metric-label">{t('analytics.driverAcceptanceRate')}</span>
                          <span className="metric-trend positive">
                            {analyticsMetrics?.driverAcceptanceRate?.trend || ''}
                          </span>
                        </div>
                        <div className="metric-icon red">
                          <span className="material-symbols-outlined">thumb_up</span>
                        </div>
                      </div>
                      <div className="metric-value">
                        {analyticsMetrics?.driverAcceptanceRate?.value || '0'}%
                      </div>
                    </div>
                  </section>

                  {/* Three Chart Panels */}
                  <section className="analytics-charts-row">
                    {/* Rides by Region - Bar Chart */}
                    <div className="analytics-chart-panel">
                      <div className="chart-panel-header">
                        <h3>{t('analytics.ridesByRegion')}</h3>
                      </div>
                      <div className="chart-content">
                        <div className="bar-chart">
                          {ridesByRegion.map((region, index) => (
                            <div key={index} className="bar-chart-item">
                              <div className="bar-label">{region.region}</div>
                              <div className="bar-container">
                                <div 
                                  className="bar-fill" 
                                  style={{ 
                                    width: `${(region.rides / Math.max(...ridesByRegion.map(r => r.rides))) * 100}%`,
                                    backgroundColor: region.color
                                  }}
                                >
                                  <span className="bar-value">{formatNumber(region.rides)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rides by Vehicle Type - Pie Chart */}
                    <div className="analytics-chart-panel">
                      <div className="chart-panel-header">
                        <h3>{t('analytics.ridesByVehicleType')}</h3>
                      </div>
                      <div className="chart-content">
                        <div className="pie-chart-container">
                          <svg className="pie-chart" viewBox="0 0 200 200" width="160" height="160">
                            {ridesByVehicleType.map((vehicle, index) => {
                              const prevPercentages = ridesByVehicleType.slice(0, index).reduce((sum, v) => sum + v.percentage, 0);
                              const startAngle = (prevPercentages / 100) * 360;
                              const endAngle = ((prevPercentages + vehicle.percentage) / 100) * 360;
                              const pathData = createPieSlice(startAngle, endAngle);
                              
                              return (
                                <path
                                  key={index}
                                  d={pathData}
                                  fill={vehicle.color}
                                  className="pie-slice-path"
                                />
                              );
                            })}
                            <circle cx="100" cy="100" r="30" fill="white" />
                          </svg>
                          <div className="pie-legend">
                            {ridesByVehicleType.map((vehicle, index) => (
                              <div key={index} className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: vehicle.color }}></span>
                                <span className="legend-label">{vehicle.type}</span>
                                <span className="legend-value">{vehicle.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Driver Acceptance Rate - Bar Chart */}
                    <div className="analytics-chart-panel">
                      <div className="chart-panel-header">
                        <h3>{t('analytics.acceptanceRateByHour')}</h3>
                      </div>
                      <div className="chart-content">
                        <div className="bar-chart">
                          {acceptanceRateByHour.map((hour, index) => (
                            <div key={index} className="bar-chart-item">
                              <div className="bar-label">{hour.hour}</div>
                              <div className="bar-container">
                                <div 
                                  className="bar-fill" 
                                  style={{ 
                                    width: `${hour.rate}%`,
                                    backgroundColor: hour.color
                                  }}
                                >
                                  <span className="bar-value">{hour.rate}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Bottom Two Panels */}
                  <section className="analytics-bottom-row">
                    {/* Driver Performance Leaderboard */}
                    <div className="analytics-chart-panel leaderboard-panel">
                      <div className="chart-panel-header">
                        <h3>{t('analytics.driverLeaderboard')}</h3>
                      </div>
                      <div className="chart-content">
                        <table className="leaderboard-table">
                          <thead>
                            <tr>
                              <th>{t('analytics.driver')}</th>
                              <th>{t('analytics.rides')}</th>
                              <th>{t('analytics.rating')}</th>
                              <th>{t('analytics.acceptPercent')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driverLeaderboard.map((driver) => (
                              <tr key={driver.id}>
                                <td>
                                  <div className="driver-cell">
                                    <img src={driver.avatar} alt={driver.name} className="driver-avatar" />
                                    <span className="driver-name">{driver.name}</span>
                                  </div>
                                </td>
                                <td className="rides-cell">{driver.rides}</td>
                                <td>
                                  <div className="rating-cell">
                                    <span className="material-symbols-outlined star-icon">star</span>
                                    <span>{driver.rating}</span>
                                  </div>
                                </td>
                                <td className="accept-cell">{driver.acceptanceRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Revenue by Payment Type - Pie Chart */}
                    <div className="analytics-chart-panel">
                      <div className="chart-panel-header">
                        <h3>{t('analytics.revenueByPaymentType')}</h3>
                      </div>
                      <div className="chart-content">
                        <div className="pie-chart-container">
                          <svg className="pie-chart" viewBox="0 0 200 200" width="160" height="160">
                            {revenueByPaymentType.map((payment, index) => {
                              const prevPercentages = revenueByPaymentType.slice(0, index).reduce((sum, p) => sum + p.percentage, 0);
                              const startAngle = (prevPercentages / 100) * 360;
                              const endAngle = ((prevPercentages + payment.percentage) / 100) * 360;
                              const pathData = createPieSlice(startAngle, endAngle);
                              
                              return (
                                <path
                                  key={index}
                                  d={pathData}
                                  fill={payment.color}
                                  className="pie-slice-path"
                                />
                              );
                            })}
                            <circle cx="100" cy="100" r="30" fill="white" />
                          </svg>
                          <div className="pie-legend">
                            {revenueByPaymentType.map((payment, index) => (
                              <div key={index} className="legend-item">
                                <span className="legend-color" style={{ backgroundColor: payment.color }}></span>
                                <span className="legend-label">{payment.type}</span>
                                <span className="legend-value">{payment.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        ) : null}
      </main>
      
      {showToast && (
        <Toast 
          message={error || 'Failed to load dashboard data'} 
          type="error" 
          onClose={closeToast}
        />
      )}
      
      <AdminWithdrawModal
        isOpen={showAdminWithdrawModal}
        onClose={() => setShowAdminWithdrawModal(false)}
        onConfirm={handleAdminWithdraw}
        availableBalance={financialOverview?.commissions?.amount}
        isLoading={isProcessingWithdraw}
      />

      {/* Section Selection Modal */}
      {showSectionModal && (
        <div className="export-section-modal-overlay" onClick={() => setShowSectionModal(false)}>
          <div className="export-section-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Sections to Export</h3>
              <button className="close-btn" onClick={() => setShowSectionModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-content">
              <div className="section-checkbox-group">
                {[
                  { key: 'metrics', label: 'Metrics Overview' },
                  { key: 'ridesByRegion', label: 'Rides by Region' },
                  { key: 'ridesByVehicleType', label: 'Rides by Vehicle Type' },
                  { key: 'acceptanceRateByHour', label: 'Driver Acceptance Rate' },
                  { key: 'driverLeaderboard', label: 'Driver Leaderboard' },
                  { key: 'revenueByPaymentType', label: 'Revenue by Payment Type' }
                ].map((section) => (
                  <label key={section.key} className="section-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.key)}
                      onChange={() => handleSectionToggle(section.key)}
                    />
                    <span className="checkmark"></span>
                    <span className="section-label">{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowSectionModal(false)}>
                Cancel
              </button>
              <button 
                className="export-btn" 
                onClick={handleSectionExport}
                disabled={selectedSections.length === 0}
              >
                Export Selected ({selectedSections.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


