import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

// Mapping from UI field names to API config keys
const FARE_CONFIG_KEY_MAP = {
  baseFare: 'base_fare',
  costPerKilometer: 'cost_per_kilometer',
  costPerMinute: 'cost_per_minute',
  airportSurcharge: 'airport_surcharge',
  minimumFare: 'minimum_fare',
  surgeMultiplier: 'surge_multiplier',
  nightSurcharge: 'night_surcharge',
  peakHourSurcharge: 'peak_hour_surcharge'
};

// Mock data for admin roles
const mockRoles = [
  {
    id: 'role_001',
    name: 'Super Admin',
    permissions: 'All access',
    users: 2,
    canDelete: false
  },
  {
    id: 'role_002',
    name: 'Manager',
    permissions: 'View/Edit Rides, Drivers, Users',
    users: 5,
    canDelete: true
  },
  {
    id: 'role_003',
    name: 'Support Agent',
    permissions: 'Support tickets, Live chat',
    users: 12,
    canDelete: true
  }
];

// Mock data for notification templates
const mockNotificationTemplates = [
  {
    id: 'template_001',
    title: 'Welcome Email',
    description: 'Sent to new users upon registration.',
    type: 'email',
    category: 'user_onboarding'
  },
  {
    id: 'template_002',
    title: 'Password Reset',
    description: 'Sent when a user requests a password reset.',
    type: 'email',
    category: 'authentication'
  },
  {
    id: 'template_003',
    title: 'Ride Completed SMS',
    description: 'Confirmation SMS after a ride ends.',
    type: 'sms',
    category: 'ride_completion'
  },
  {
    id: 'template_004',
    title: 'Driver Payout',
    description: 'Notification for successful payouts.',
    type: 'email',
    category: 'financial'
  }
];

// Mock API keys
const mockApiKeys = {
  googleMaps: 'AIzaSyBvOkBwXyZ1234567890abcdefghijklmnop',
  qpay: 'qpay_sk_live_1234567890abcdefghijklmnopqrstuvwxyz'
};

// Mock fare cost settings
const mockFareCosts = {
  baseFare: 5.00,
  costPerKilometer: 1.50,
  costPerMinute: 0.30,
  airportSurcharge: 25.00,
  minimumFare: 10.00,
  surgeMultiplier: 1.0,
  nightSurcharge: 5.00,
  peakHourSurcharge: 3.00
};

// Mock system settings
const mockSystemSettings = {
  language: 'english', // 'english' or 'arabic'
  theme: 'dark', // 'light' or 'dark'
  apiKeys: mockApiKeys,
  fareCosts: mockFareCosts
};

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all admin roles
export const fetchRoles = async () => {
  await delay(500);
  return {
    success: true,
    data: mockRoles
  };
};

// Add a new role
export const addRole = async (roleData) => {
  await delay(800);
  
  const newRole = {
    id: `role_${Date.now()}`,
    name: roleData.name,
    permissions: roleData.permissions,
    users: 0,
    canDelete: true
  };
  
  mockRoles.push(newRole);
  
  return {
    success: true,
    data: newRole
  };
};

// Update an existing role
export const updateRole = async (roleId, roleData) => {
  await delay(600);
  
  const roleIndex = mockRoles.findIndex(role => role.id === roleId);
  if (roleIndex !== -1) {
    mockRoles[roleIndex] = {
      ...mockRoles[roleIndex],
      ...roleData
    };
    
    return {
      success: true,
      data: mockRoles[roleIndex]
    };
  }
  
  return {
    success: false,
    error: 'Role not found'
  };
};

// Delete a role
export const deleteRole = async (roleId) => {
  await delay(400);
  
  const roleIndex = mockRoles.findIndex(role => role.id === roleId);
  if (roleIndex !== -1) {
    mockRoles.splice(roleIndex, 1);
    return {
      success: true,
      message: 'Role deleted successfully'
    };
  }
  
  return {
    success: false,
    error: 'Role not found'
  };
};

// Fetch notification templates
export const fetchNotificationTemplates = async () => {
  await delay(300);
  return {
    success: true,
    data: mockNotificationTemplates
  };
};

// Update notification template
export const updateNotificationTemplate = async (templateId, templateData) => {
  await delay(500);
  
  const templateIndex = mockNotificationTemplates.findIndex(template => template.id === templateId);
  if (templateIndex !== -1) {
    mockNotificationTemplates[templateIndex] = {
      ...mockNotificationTemplates[templateIndex],
      ...templateData
    };
    
    return {
      success: true,
      data: mockNotificationTemplates[templateIndex]
    };
  }
  
  return {
    success: false,
    error: 'Template not found'
  };
};

// Fetch system settings
export const fetchSystemSettings = async () => {
  await delay(300);
  
  // Get language from localStorage if available
  const savedLanguage = localStorage.getItem('appLanguage');
  if (savedLanguage) {
    mockSystemSettings.language = savedLanguage;
  }
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Update system settings
export const updateSystemSettings = async (settingsData) => {
  await delay(500);
  
  // Update the mock settings
  Object.assign(mockSystemSettings, settingsData);
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Copy API key to clipboard
export const copyApiKey = async (keyType) => {
  await delay(200);
  
  const keyValue = keyType === 'googleMaps' ? mockApiKeys.googleMaps : mockApiKeys.qpay;
  
  try {
    await navigator.clipboard.writeText(keyValue);
    return {
      success: true,
      message: `${keyType} API key copied to clipboard`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to copy to clipboard'
    };
  }
};

// Toggle language setting
export const toggleLanguage = async (language) => {
  await delay(300);
  
  mockSystemSettings.language = language;
  
  // Sync with localStorage
  localStorage.setItem('appLanguage', language);
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Toggle theme setting
export const toggleTheme = async (theme) => {
  await delay(300);
  
  mockSystemSettings.theme = theme;
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Search settings
export const searchSettings = async (searchTerm) => {
  await delay(400);
  
  const searchLower = searchTerm.toLowerCase();
  
  const filteredRoles = mockRoles.filter(role =>
    role.name.toLowerCase().includes(searchLower) ||
    role.permissions.toLowerCase().includes(searchLower)
  );
  
  const filteredTemplates = mockNotificationTemplates.filter(template =>
    template.title.toLowerCase().includes(searchLower) ||
    template.description.toLowerCase().includes(searchLower)
  );
  
  return {
    success: true,
    data: {
      roles: filteredRoles,
      templates: filteredTemplates
    }
  };
};

// Fetch fare cost settings
export const fetchFareCosts = async () => {
  await delay(300);
  return {
    success: true,
    data: mockFareCosts
  };
};

// Update fare cost settings
export const updateFareCosts = async (fareCostData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    console.log('🚀 UPDATING FARE COSTS:', {
      '📊 Fare Cost Data': fareCostData,
      '🔑 Has Token': !!token,
      '⏰ Timestamp': new Date().toISOString()
    });

    // Update each fare config field via API
    const updatePromises = Object.keys(fareCostData).map(async (fieldName) => {
      const configKey = FARE_CONFIG_KEY_MAP[fieldName];
      if (!configKey) {
        console.warn(`⚠️ No config key mapping found for field: ${fieldName}`);
        return null;
      }

      const configValue = fareCostData[fieldName];
      
      console.log(`🔄 Updating ${fieldName} (${configKey}):`, configValue);

      try {
        const response = await fetch(`${API_BASE_URL}/admin-fare-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            config_key: configKey,
            config_value: parseFloat(configValue) || 0
          }),
        });

        console.log(`📡 API Response for ${configKey}:`, {
          '✅ Status': response.status,
          '📝 Status Text': response.statusText,
          '✅ OK': response.ok
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully updated ${configKey}:`, data);
        
        return { fieldName, configKey, success: true, data };
      } catch (error) {
        console.error(`❌ Error updating ${configKey}:`, error);
        return { fieldName, configKey, success: false, error: error.message };
      }
    });

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const failedUpdates = results.filter(r => r && !r.success);
    if (failedUpdates.length > 0) {
      const errorMessages = failedUpdates.map(r => `${r.configKey}: ${r.error}`).join(', ');
      throw new Error(`Failed to update some fare costs: ${errorMessages}`);
    }

    // Update local mock data for consistency
    Object.assign(mockFareCosts, fareCostData);
    mockSystemSettings.fareCosts = mockFareCosts;

    console.log('✅ All fare costs updated successfully');

    return {
      success: true,
      data: fareCostData,
      message: 'Fare costs updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating fare costs:', error);
    return {
      success: false,
      error: error.message || 'Failed to update fare costs'
    };
  }
};
