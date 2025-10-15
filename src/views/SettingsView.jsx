import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SettingsView.css';
import { logoutUser } from '../services/authService';
import { fetchRoles, addRole, updateRole, deleteRole, fetchNotificationTemplates, updateNotificationTemplate, fetchSystemSettings, updateSystemSettings, copyApiKey, toggleLanguage, toggleTheme, searchSettings } from '../services/settingsService';
import logo from '../assets/images/logo.webp';
import settingsIcon from '../assets/icons/settings.png';
import notificationsIcon from '../assets/icons/notifications.png';
import Toast from '../components/Toast';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function SettingsView() {
  const navigate = useNavigate();
  
  // State management
  const [roles, setRoles] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    language: 'english',
    theme: 'dark',
    apiKeys: {
      googleMaps: '',
      qpay: ''
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    permissions: ''
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setIsLoading(true);
    try {
      const [rolesResult, templatesResult, settingsResult] = await Promise.all([
        fetchRoles(),
        fetchNotificationTemplates(),
        fetchSystemSettings()
      ]);

      if (rolesResult.success) {
        setRoles(rolesResult.data);
      }
      if (templatesResult.success) {
        setNotificationTemplates(templatesResult.data);
      }
      if (settingsResult.success) {
        setSystemSettings(settingsResult.data);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
      showToastMessage('Failed to load settings data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const closeToast = () => {
    setShowToast(false);
    setToastMessage('');
  };

  const handleLanguageToggle = async (language) => {
    try {
      const result = await toggleLanguage(language);
      if (result.success) {
        setSystemSettings(prev => ({ ...prev, language }));
        showToastMessage('Language updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      showToastMessage('Failed to update language', 'error');
    }
  };

  const handleThemeToggle = async (theme) => {
    try {
      const result = await toggleTheme(theme);
      if (result.success) {
        setSystemSettings(prev => ({ ...prev, theme }));
        showToastMessage('Theme updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      showToastMessage('Failed to update theme', 'error');
    }
  };

  const handleCopyApiKey = async (keyType) => {
    try {
      const result = await copyApiKey(keyType);
      if (result.success) {
        showToastMessage(result.message, 'success');
      } else {
        showToastMessage(result.error, 'error');
      }
    } catch (error) {
      console.error('Error copying API key:', error);
      showToastMessage('Failed to copy API key', 'error');
    }
  };

  const handleAddRole = async () => {
    if (!newRoleData.name || !newRoleData.permissions) {
      showToastMessage('Please fill in all fields', 'error');
      return;
    }

    try {
      const result = await addRole(newRoleData);
      if (result.success) {
        setRoles(prev => [...prev, result.data]);
        setShowAddRoleModal(false);
        setNewRoleData({ name: '', permissions: '' });
        showToastMessage('Role added successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding role:', error);
      showToastMessage('Failed to add role', 'error');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const result = await deleteRole(roleId);
        if (result.success) {
          setRoles(prev => prev.filter(role => role.id !== roleId));
          showToastMessage('Role deleted successfully', 'success');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        showToastMessage('Failed to delete role', 'error');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadSettingsData();
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchSettings(searchTerm);
      if (result.success) {
        setRoles(result.data.roles);
        setNotificationTemplates(result.data.templates);
      }
    } catch (error) {
      console.error('Error searching settings:', error);
      showToastMessage('Failed to search settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'financial') {
      navigate('/dashboard?section=financial');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logoutUser();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    }
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  return (
    <div className="settings-view grid-root">
      <aside className="side">
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label="Dashboard" onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label="Ride Management" onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label="Driver Management" onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label="User Management" onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label="Financial" onClick={() => handleNavClick('financial')} />
          <NavItem icon="support_agent" label="Support" onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label="Analytics" onClick={() => handleNavClick('analytics')} />
          <NavItem icon="assessment" label="Reports" onClick={() => handleNavClick('reports')} />
        </nav>

        <div className="sfoot">
          <button className="settings" type="button" onClick={() => navigate('/settings')}>
            <img src={settingsIcon} alt="settings" className="kimg" />
            <span>Settings</span>
          </button>
          <div className="urow">
            <img src="https://i.pravatar.cc/80?img=5" alt="Amina" className="avatar" />
            <div className="meta">
              <div className="name">Amina Al-Thani</div>
              <div className="role">Super Admin</div>
            </div>
            <button className="logout-btn-sidebar" aria-label="logout" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="titles">
            <h1>Admin Settings</h1>
            <p className="sub">Manage your platform's configuration and preferences.</p>
          </div>
          <div className="acts">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search settings..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
            <button className="notifications-btn" aria-label="notifications">
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <span className="notification-dot"></span>
            </button>
            <div className="user-info">
              <span className="user-name">Amina Al-Thani</span>
              <button className="logout-btn" aria-label="logout" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading settings...</p>
            </div>
          ) : (
            <>
              {/* System Settings Section */}
              <div className="settings-card system-settings-card">
                <div className="card-header">
                  <h2>System Settings</h2>
                </div>
                <div className="card-content">
                  <div className="settings-grid">
                    <div className="settings-section">
                      <h3>Display & Language</h3>
                      <div className="setting-group">
                        <label>Language</label>
                        <div className="toggle-group">
                          <button
                            className={`toggle-btn ${systemSettings.language === 'english' ? 'active' : ''}`}
                            onClick={() => handleLanguageToggle('english')}
                          >
                            English
                          </button>
                          <button
                            className={`toggle-btn ${systemSettings.language === 'arabic' ? 'active' : ''}`}
                            onClick={() => handleLanguageToggle('arabic')}
                          >
                            العربية
                          </button>
                        </div>
                      </div>
                      <div className="setting-group">
                        <label>Theme</label>
                        <div className="toggle-group">
                          <button
                            className={`toggle-btn ${systemSettings.theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeToggle('light')}
                          >
                            <span className="material-symbols-outlined">settings</span>
                            Light
                          </button>
                          <button
                            className={`toggle-btn ${systemSettings.theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeToggle('dark')}
                          >
                            <span className="material-symbols-outlined">dark_mode</span>
                            Dark
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="settings-section">
                      <h3>API Keys</h3>
                      <div className="setting-group">
                        <label>Google Maps API Key</label>
                        <div className="api-key-input">
                          <input
                            type="text"
                            value={maskApiKey(systemSettings.apiKeys.googleMaps)}
                            readOnly
                            className="api-key-field"
                          />
                          <button
                            className="copy-btn"
                            onClick={() => handleCopyApiKey('googleMaps')}
                            title="Copy API Key"
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                          </button>
                        </div>
                      </div>
                      <div className="setting-group">
                        <label>QPay API Key</label>
                        <div className="api-key-input">
                          <input
                            type="text"
                            value={maskApiKey(systemSettings.apiKeys.qpay)}
                            readOnly
                            className="api-key-field"
                          />
                          <button
                            className="copy-btn"
                            onClick={() => handleCopyApiKey('qpay')}
                            title="Copy API Key"
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Role Management Section */}
              <div className="settings-card role-management-card">
                <div className="card-header">
                  <h2>Admin Role Management</h2>
                  <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
                    <span className="material-symbols-outlined">add</span>
                    Add New Role
                  </button>
                </div>
                <div className="card-content">
                  <div className="roles-table-container">
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>ROLE NAME</th>
                          <th>PERMISSIONS</th>
                          <th>USERS</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id}>
                            <td className="role-name">{role.name}</td>
                            <td className="permissions">{role.permissions}</td>
                            <td className="user-count">{role.users}</td>
                            <td className="actions-cell">
                              <div className="action-links">
                                <button className="edit-link">Edit</button>
                                {role.canDelete && (
                                  <button 
                                    className="delete-link"
                                    onClick={() => handleDeleteRole(role.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notification Templates Section */}
              <div className="settings-card notification-templates-card">
                <div className="card-header">
                  <h2>Notification Templates</h2>
                </div>
                <div className="card-content">
                  <div className="templates-grid">
                    {notificationTemplates.map((template) => (
                      <div key={template.id} className="template-card">
                        <div className="template-content">
                          <h3>{template.title}</h3>
                          <p>{template.description}</p>
                        </div>
                        <button className="template-arrow">
                          <span className="material-symbols-outlined">arrow_forward_ios</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Role</h3>
            <div className="form-group">
              <label>Role Name</label>
              <input
                type="text"
                value={newRoleData.name}
                onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Permissions</label>
              <textarea
                value={newRoleData.permissions}
                onChange={(e) => setNewRoleData(prev => ({ ...prev, permissions: e.target.value }))}
                placeholder="Enter permissions"
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={handleAddRole}>
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={closeToast}
        />
      )}
    </div>
  );
}
