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

// Mock system settings
const mockSystemSettings = {
  language: 'english', // 'english' or 'arabic'
  theme: 'dark', // 'light' or 'dark'
  apiKeys: mockApiKeys
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
