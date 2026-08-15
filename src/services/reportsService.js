import { authenticatedFetch } from './apiClient';
import { SUPABASE_ANON_KEY } from './authService';


const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-reports';

const getAnonApiKey = () => localStorage.getItem('anonKey') || SUPABASE_ANON_KEY;

const DEFAULT_REPORT_TYPES = [
  { value: 'ride_history', label: 'Ride History' },
  { value: 'driver_performance', label: 'Driver Performance' },
  { value: 'payment_transactions', label: 'Payment Transactions' },
  { value: 'user_activity', label: 'User Activity' },
  { value: 'financial_summary', label: 'Financial Summary' },
  { value: 'analytics_overview', label: 'Analytics Overview' },
];

const DEFAULT_RIDE_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
];

const DEFAULT_EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'XLSX' },
];

const getAuthHeaders = (includeJson = false) => {
  const headers = {
    apikey: getAnonApiKey(),
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const parseErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    return errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
  } catch {
    return response.statusText || `HTTP error! status: ${response.status}`;
  }
};

const formatLabel = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDateRange = (report) => {
  if (report.date_range) return report.date_range;
  if (report.dateRange) return report.dateRange;

  const start = report.start_date || report.startDate;
  const end = report.end_date || report.endDate;

  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return 'N/A';
};

const normalizeStatus = (status) => {
  if (!status) return 'Processing';
  const normalized = String(status).toLowerCase();
  if (normalized === 'ready' || normalized === 'completed') return 'Ready';
  if (normalized === 'failed' || normalized === 'error') return 'Failed';
  if (normalized === 'processing' || normalized === 'pending') return 'Processing';
  return formatLabel(status);
};

export const transformReportData = (report) => {
  if (!report || typeof report !== 'object') return null;

  return {
    id: report.id || report.report_id,
    name: report.name || report.report_name || formatLabel(report.report_type || report.type) || 'Report',
    dateRange: formatDateRange(report),
    generatedOn: formatDateTime(report.generated_on || report.generated_at || report.created_at || report.createdAt),
    generatedOnAt: report.generated_on || report.generated_at || report.created_at || report.createdAt || null,
    dateRangeStart: report.start_date || report.startDate || null,
    dateRangeEnd: report.end_date || report.endDate || null,
    dateRangeText: report.date_range || report.dateRange || null,
    status: normalizeStatus(report.status),
    statusRaw: report.status || 'processing',
    type: report.report_type || report.type || '',
    format: (report.format || '').toUpperCase(),
    downloadUrl: report.download_url || report.downloadUrl || null,
    createdAt: report.created_at || report.createdAt || null,
  };
};

const extractReportsList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeOptionList = (items, fallback) => {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  return items.map((item) => {
    if (typeof item === 'string') {
      const value = item.toLowerCase().replace(/\s+/g, '_');
      return { value, label: formatLabel(item) };
    }

    const value = item.value || item.id || item.key || item.code || item.report_type;
    const label = item.label || item.name || item.title || formatLabel(value);

    return { value, label };
  }).filter((item) => item.value);
};

const normalizeOptions = (payload) => {
  const source = payload?.data || payload || {};

  return {
    reportTypes: normalizeOptionList(
      source.report_types || source.reportTypes || source.types,
      DEFAULT_REPORT_TYPES
    ),
    rideStatuses: normalizeOptionList(
      source.ride_statuses || source.rideStatuses || source.statuses || source.status_filters,
      DEFAULT_RIDE_STATUSES
    ),
    exportFormats: normalizeOptionList(
      source.formats || source.export_formats || source.exportFormats,
      DEFAULT_EXPORT_FORMATS
    ),
  };
};

export const getReportOptions = async () => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}?action=options`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    return { success: true, data: normalizeOptions(data) };
  } catch (error) {
    console.error('Report Options API Error:', error);
    return {
      success: true,
      data: normalizeOptions({}),
      warning: error.message,
    };
  }
};

export const fetchReports = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await authenticatedFetch(`${API_BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    const reports = extractReportsList(data)
      .map(transformReportData)
      .filter(Boolean);

    return {
      success: true,
      data: reports,
      pagination: {
        page: data.page || data.data?.page || page,
        limit: data.limit || data.data?.limit || limit,
        total: data.total || data.data?.total || reports.length,
        totalPages: data.total_pages || data.data?.total_pages || 1,
      },
    };
  } catch (error) {
    console.error('Reports List API Error:', error);
    return { success: false, error: error.message };
  }
};

export const generateReport = async (reportConfig) => {
  try {
    const body = {
      report_type: reportConfig.type,
      start_date: reportConfig.startDate,
      end_date: reportConfig.endDate,
      format: String(reportConfig.format || 'csv').toLowerCase(),
    };

    if (reportConfig.name?.trim()) {
      body.name = reportConfig.name.trim();
    }

    if (reportConfig.type === 'ride_history' && reportConfig.rideStatus) {
      body.status_filter = String(reportConfig.rideStatus).toLowerCase();
    }

    const response = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json();
    const report = transformReportData(data.report || data.data?.report || data.data || data);

    return {
      success: true,
      data: report,
      message: data.message || 'Report generation started',
    };
  } catch (error) {
    console.error('Generate Report API Error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteReport = async (reportId) => {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}?id=${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || 'Report deleted successfully',
    };
  } catch (error) {
    console.error('Delete Report API Error:', error);
    return { success: false, error: error.message };
  }
};

export const retryReport = async (reportId) => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}?action=retry&id=${encodeURIComponent(reportId)}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      message: data.message || 'Report generation restarted',
    };
  } catch (error) {
    console.error('Retry Report API Error:', error);
    return { success: false, error: error.message };
  }
};

export const downloadReport = async (reportId, reportName = 'report', format = 'csv') => {
  try {
    const response = await authenticatedFetch(
      `${API_BASE_URL}?action=download&id=${encodeURIComponent(reportId)}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const blob = await response.blob();
    const extension = String(format || 'csv').toLowerCase();
    const safeName = String(reportName || 'report').replace(/[^\w\-]+/g, '_');
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName}.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Report downloaded successfully',
    };
  } catch (error) {
    console.error('Download Report API Error:', error);
    return { success: false, error: error.message };
  }
};

export const searchReports = async (searchTerm, { page = 1, limit = 20 } = {}) => {
  const result = await fetchReports({ page, limit });
  if (!result.success) return result;

  const query = searchTerm.trim().toLowerCase();
  if (!query) return result;

  const filteredReports = result.data.filter((report) =>
    report.name.toLowerCase().includes(query) ||
    report.type.toLowerCase().includes(query) ||
    report.status.toLowerCase().includes(query)
  );

  return {
    ...result,
    data: filteredReports,
  };
};

export const getDefaultReportConfig = () => ({
  type: DEFAULT_REPORT_TYPES[0].value,
  startDate: '',
  endDate: '',
  rideStatus: DEFAULT_RIDE_STATUSES[0].value,
  format: DEFAULT_EXPORT_FORMATS[0].value,
  name: '',
});

export const getDefaultReportOptions = () => normalizeOptions({});

const formatISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDefaultPaymentTransactionsDateRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getFullYear(), 0, 1);

  return {
    startDate: formatISODate(startDate),
    endDate: formatISODate(endDate),
  };
};

const sleep = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const exportPaymentTransactionsPDF = async ({ startDate, endDate } = {}) => {
  const defaults = getDefaultPaymentTransactionsDateRange();
  const resolvedStartDate = startDate || defaults.startDate;
  const resolvedEndDate = endDate || defaults.endDate;

  const generateResult = await generateReport({
    type: 'payment_transactions',
    startDate: resolvedStartDate,
    endDate: resolvedEndDate,
    format: 'pdf',
  });

  if (!generateResult.success) {
    return generateResult;
  }

  let report = generateResult.data;
  if (!report?.id) {
    return {
      success: false,
      error: generateResult.message || 'Report was queued but no report ID was returned.',
    };
  }

  if (report.status !== 'Ready') {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await sleep(2500);

      const listResult = await fetchReports({ page: 1, limit: 50 });
      if (!listResult.success) {
        continue;
      }

      const latest = listResult.data.find((item) => item.id === report.id);
      if (!latest) {
        continue;
      }

      report = latest;
      if (latest.status === 'Ready') {
        break;
      }

      if (latest.status === 'Failed') {
        return { success: false, error: 'Report generation failed' };
      }
    }
  }

  if (report.status !== 'Ready') {
    return {
      success: false,
      error: 'Report is still processing. Open Reports to download it when ready.',
      reportId: report.id,
    };
  }

  return downloadReport(report.id, report.name || 'payment_transactions', 'pdf');
};
