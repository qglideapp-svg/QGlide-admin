import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationManagementView.css';
import { logoutUser } from '../../services/authService';
import { sendPushNotification } from '../../services/notificationService';
import Toast from '../../components/common/Toast';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/images/logo.webp';
import settingsIcon from '../../assets/icons/settings.png';
import notificationsIcon from '../../assets/icons/notifications.png';

const NavItem = ({ icon, label, active, onClick }) => (
  <button className={`snav ${active ? 'active' : ''}`} type="button" onClick={onClick}>
    <span className="material-symbols-outlined">{icon}</span>
    <span className="txt">{label}</span>
  </button>
);

export default function NotificationManagementView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'news', // 'news' or 'event'
    imageUrl: '',
    actionUrl: '',
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') {
      navigate('/dashboard');
    } else if (navItem === 'ride-management') {
      navigate('/ride-management');
    } else if (navItem === 'courier-management') {
      navigate('/courier-management');
    } else if (navItem === 'rental-management') {
      navigate('/rental-management');
    } else if (navItem === 'driver-management') {
      navigate('/driver-management');
    } else if (navItem === 'user-management') {
      navigate('/user-management');
    } else if (navItem === 'financial') {
      navigate('/dashboard?section=financial');
    } else if (navItem === 'support') {
      navigate('/dashboard?section=support');
    } else if (navItem === 'analytics') {
      navigate('/dashboard?section=analytics');
    } else if (navItem === 'reports') {
      navigate('/reports');
    } else if (navItem === 'withdrawals') {
      navigate('/withdrawals');
    } else if (navItem === 'notifications') {
      // Already on notifications page
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('common.confirmLogout'))) {
      try {
        await logoutUser();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        navigate('/login');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setToast({
        type: 'error',
        message: 'Title is required'
      });
      return;
    }
    
    if (!formData.message.trim()) {
      setToast({
        type: 'error',
        message: 'Message is required'
      });
      return;
    }

    setIsSending(true);

    try {
      const result = await sendPushNotification(formData);

      if (result.success) {
        setToast({
          type: 'success',
          message: 'Notification sent successfully to all users!'
        });
        
        // Reset form
        setFormData({
          title: '',
          message: '',
          type: 'news',
          imageUrl: '',
          actionUrl: '',
        });
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to send notification'
        });
      }
    } catch (error) {
      console.error('Send notification error:', error);
      setToast({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`notification-management grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`side ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sbrand">
          <img src={logo} alt="QGlide" className="slogo" />
        </div>
        <nav className="slist">
          <NavItem icon="space_dashboard" label={t('navigation.dashboard')} onClick={() => handleNavClick('dashboard')} />
          <NavItem icon="local_taxi" label={t('navigation.rideManagement')} onClick={() => handleNavClick('ride-management')} />
          <NavItem icon="directions_car" label={t('navigation.driverManagement')} onClick={() => handleNavClick('driver-management')} />
          <NavItem icon="group" label={t('navigation.userManagement')} onClick={() => handleNavClick('user-management')} />
          <NavItem icon="account_balance_wallet" label={t('navigation.financial')} onClick={() => handleNavClick('financial')} />
          <NavItem icon="payments" label={t('navigation.withdrawals')} onClick={() => handleNavClick('withdrawals')} />
          <NavItem icon="notifications" label="Notifications" active={true} />
          <NavItem icon="support_agent" label={t('navigation.support')} onClick={() => handleNavClick('support')} />
          <NavItem icon="insights" label={t('navigation.analytics')} onClick={() => handleNavClick('analytics')} />
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
        <header className="top">
          <div className="titles">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1>Push Notifications</h1>
              <p className="sub">Send notifications to all users about news or events</p>
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
            <button className="ibtn" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <button className="ibtn" aria-label={t('common.notifications')}>
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container">
          <div className="notification-card">
            <div className="card-header">
              <div className="header-left">
                <h2>Send Push Notification</h2>
                <p className="subtitle">Create and send a notification to all users</p>
              </div>
            </div>

            <form className="notification-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="type">Notification Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="news">News</option>
                  <option value="event">Event</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter notification title"
                  required
                  maxLength={100}
                />
                <span className="char-count">{formData.title.length}/100</span>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Enter notification message"
                  required
                  rows={6}
                  maxLength={500}
                />
                <span className="char-count">{formData.message.length}/500</span>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL (Optional)</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
                <small className="form-hint">URL to an image that will be displayed with the notification</small>
              </div>

              <div className="form-group">
                <label htmlFor="actionUrl">Action URL (Optional)</label>
                <input
                  type="url"
                  id="actionUrl"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/page"
                />
                <small className="form-hint">URL that users will be redirected to when they tap the notification</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setFormData({
                      title: '',
                      message: '',
                      type: 'news',
                      imageUrl: '',
                      actionUrl: '',
                    });
                  }}
                  disabled={isSending}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSending || !formData.title.trim() || !formData.message.trim()}
                >
                  {isSending ? (
                    <>
                      <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                        hourglass_empty
                      </span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </div>
  );
}
