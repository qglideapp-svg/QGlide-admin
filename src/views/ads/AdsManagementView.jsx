import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdsManagementView.css';
import { logoutUser } from '../../services/authService';
import {
  PLACEMENT_SLOTS,
  loadAdConfig,
  saveAdConfig,
} from '../../services/adService';
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

function PhonePreview({ slotDef, placement }) {
  const headline = placement.headline?.trim() || 'Your headline';
  const body = placement.body?.trim() || 'Short supporting copy for riders.';
  const cta = placement.ctaText?.trim() || 'Learn more';
  const hasImg = Boolean(placement.imageUrl?.trim());

  const imgBlock = hasImg ? (
    <img className="ads-creative-img" src={placement.imageUrl.trim()} alt="" />
  ) : (
    <div className="ads-creative-img placeholder" aria-hidden>
      Creative
    </div>
  );

  const creative = (
    <div className="ads-creative">
      {imgBlock}
      <div className="ads-creative-body">
        <h4>{headline}</h4>
        <p>{body}</p>
        <span className="ads-creative-cta">{cta}</span>
      </div>
    </div>
  );

  const previewClass = `ads-mock-body preview-${slotDef.preview}`;

  if (slotDef.preview === 'complete') {
    return (
      <div className="ads-phone-screen">
        <div className="ads-mock-header">
          <span>9:41</span>
          <span>Trip</span>
          <span>●●●</span>
        </div>
        <div className={previewClass}>
          <div className="success-chip">Trip complete · Thanks for riding</div>
          {creative}
        </div>
      </div>
    );
  }

  if (slotDef.preview === 'profile') {
    return (
      <div className="ads-phone-screen">
        <div className="ads-mock-header">
          <span>9:41</span>
          <span>Account</span>
          <span>●●●</span>
        </div>
        <div className={previewClass}>
          <div className="profile-block">
            <div className="avatar-circle" />
            <div className="name-line" />
          </div>
          {creative}
          <div className="ads-mock-map">
            <div className="ads-mock-pin" />
          </div>
        </div>
      </div>
    );
  }

  if (slotDef.preview === 'strip') {
    return (
      <div className="ads-phone-screen">
        <div className="ads-mock-header">
          <span>9:41</span>
          <span>Book a ride</span>
          <span>●●●</span>
        </div>
        <div className={previewClass}>
          <div className="ads-mock-map">
            <div className="ads-mock-pin" />
          </div>
          {creative}
          <div className="ads-mock-cta">Request ride</div>
        </div>
      </div>
    );
  }

  /* hero */
  return (
    <div className="ads-phone-screen">
      <div className="ads-mock-header">
        <span>9:41</span>
        <span>Home</span>
        <span>●●●</span>
      </div>
      <div className={previewClass}>
        {creative}
        <div className="ads-mock-map">
          <div className="ads-mock-pin" />
        </div>
        <div className="ads-mock-cta">Where to?</div>
      </div>
    </div>
  );
}

export default function AdsManagementView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(PLACEMENT_SLOTS[0].id);
  const [config, setConfig] = useState(() => loadAdConfig().data);

  useEffect(() => {
    const r = loadAdConfig();
    if (r.success) setConfig(r.data);
  }, []);

  const slotDef = useMemo(
    () => PLACEMENT_SLOTS.find((s) => s.id === selectedId) || PLACEMENT_SLOTS[0],
    [selectedId],
  );

  const placement = config.placements[selectedId] || {};

  const activeCount = useMemo(
    () => Object.values(config.placements).filter((p) => p.active).length,
    [config.placements],
  );

  const updateField = useCallback((field, value) => {
    setConfig((prev) => ({
      ...prev,
      placements: {
        ...prev.placements,
        [selectedId]: {
          ...prev.placements[selectedId],
          [field]: value,
        },
      },
    }));
  }, [selectedId]);

  const handleNavClick = (navItem) => {
    if (navItem === 'dashboard') navigate('/dashboard');
    else if (navItem === 'ride-management') navigate('/ride-management');
    else if (navItem === 'courier-management') navigate('/courier-management');
    else if (navItem === 'rental-management') navigate('/rental-management');
    else if (navItem === 'driver-management') navigate('/driver-management');
    else if (navItem === 'user-management') navigate('/user-management');
    else if (navItem === 'financial') navigate('/dashboard?section=financial');
    else if (navItem === 'support') navigate('/dashboard?section=support');
    else if (navItem === 'analytics') navigate('/dashboard?section=analytics');
    else if (navItem === 'reports') navigate('/reports');
    else if (navItem === 'withdrawals') navigate('/withdrawals');
    else if (navItem === 'notifications') navigate('/notifications');
    else if (navItem === 'ads') navigate('/ads');
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

  const handleSavePlacement = async () => {
    if (!placement.headline?.trim()) {
      setToast({ type: 'error', message: 'Add a headline before publishing this placement.' });
      return;
    }
    setSaving(true);
    const next = {
      ...config,
      placements: {
        ...config.placements,
        [selectedId]: {
          ...placement,
          updatedAt: new Date().toISOString(),
        },
      },
    };
    const result = await saveAdConfig(next);
    setSaving(false);
    if (result.success) {
      setConfig(next);
      setToast({
        type: 'success',
        message: 'Placement saved. The mobile app can sync this on the next config fetch.',
      });
    } else {
      setToast({ type: 'error', message: result.error || 'Could not save.' });
    }
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className={`ads-management grid-root ${theme === 'dark' ? 'dark-mode' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
          <NavItem icon="notifications" label="Notifications" onClick={() => handleNavClick('notifications')} />
          <NavItem icon="campaign" label={t('navigation.ads')} active />
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
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar" type="button">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1>{t('navigation.ads')}</h1>
              <p className="sub">Design placements that every rider sees inside the mobile app</p>
            </div>
          </div>
          <div className="acts">
            <div className="search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder={t('common.search')} readOnly aria-hidden />
            </div>
            <button type="button" className="chip on">EN</button>
            <button type="button" className="chip">AR</button>
            <ThemeToggle />
            <button className="ibtn" type="button" aria-label={t('common.settings')} onClick={() => navigate('/settings')}>
              <img src={settingsIcon} alt="settings" className="kimg" />
            </button>
            <button className="ibtn" type="button" aria-label={t('common.notifications')}>
              <img src={notificationsIcon} alt="notifications" className="kimg" />
              <i className="dot" />
            </button>
            <div className="user-info">
              <span className="user-name">QGlide Admin</span>
              <button className="logout-btn" type="button" aria-label={t('common.logout')} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <section className="ads-hero-band" aria-label="Overview">
          <div className="ads-hero-inner">
            <div>
              <div className="ads-hero-badge">
                <span className="material-symbols-outlined">hub</span>
                Broadcast to all app users
              </div>
              <h2>Ad studio for the rider app</h2>
              <p>
                Pick a screen moment, drop in creative and a deep link, then publish. Each slot maps to a native
                placement your mobile team can read from config — riders always get a consistent, on-brand experience.
              </p>
            </div>
          </div>
        </section>

        <div className="ads-stats">
          <div className="ads-stat-card">
            <div className="k">Live placements</div>
            <div className="v">{activeCount}</div>
            <div className="hint">Turned on across the four mobile slots</div>
          </div>
          <div className="ads-stat-card">
            <div className="k">Audience</div>
            <div className="v">All riders</div>
            <div className="hint">Same payload for every signed-in user</div>
          </div>
          <div className="ads-stat-card">
            <div className="k">Last publish</div>
            <div className="v" style={{ fontSize: '0.95rem' }}>
              {config.lastPublishedAt
                ? new Date(config.lastPublishedAt).toLocaleString()
                : '—'}
            </div>
            <div className="hint">Stored locally until API is connected</div>
          </div>
        </div>

        <div className="ads-studio">
          <div className="ads-slot-list">
            {PLACEMENT_SLOTS.map((slot) => {
              const p = config.placements[slot.id];
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`ads-slot-btn ${selectedId === slot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(slot.id)}
                >
                  <div className="ic">
                    <span className="material-symbols-outlined">{slot.icon}</span>
                  </div>
                  <div>
                    <div className="slot-title">{slot.label}</div>
                    <div className="slot-desc">{slot.description}</div>
                    <div className="ads-slot-meta">
                      <span className={`ads-pill ${p?.active ? '' : 'off'}`}>{p?.active ? 'Live' : 'Draft'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="ads-editor-panel">
            <h3>{slotDef.label}</h3>
            <p className="sub">{slotDef.description}</p>

            <div className="ads-form-grid">
              <div className="ads-toggle-row">
                <span>Show to all users on this screen</span>
                <button
                  type="button"
                  className={`ads-switch ${placement.active ? 'on' : ''}`}
                  aria-pressed={Boolean(placement.active)}
                  onClick={() => updateField('active', !placement.active)}
                />
              </div>

              <div className="ads-field">
                <label htmlFor="ad-headline">Headline</label>
                <input
                  id="ad-headline"
                  value={placement.headline || ''}
                  onChange={(e) => updateField('headline', e.target.value)}
                  placeholder="e.g. Weekend rides, 20% off"
                  maxLength={80}
                />
              </div>

              <div className="ads-field">
                <label htmlFor="ad-body">Supporting copy</label>
                <textarea
                  id="ad-body"
                  value={placement.body || ''}
                  onChange={(e) => updateField('body', e.target.value)}
                  placeholder="One or two lines riders see under the headline"
                  maxLength={220}
                />
              </div>

              <div className="ads-field">
                <label htmlFor="ad-image">Creative image URL</label>
                <input
                  id="ad-image"
                  type="url"
                  value={placement.imageUrl || ''}
                  onChange={(e) => updateField('imageUrl', e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div className="ads-row-2">
                <div className="ads-field">
                  <label htmlFor="ad-cta">Button label</label>
                  <input
                    id="ad-cta"
                    value={placement.ctaText || ''}
                    onChange={(e) => updateField('ctaText', e.target.value)}
                    placeholder="Shop deals"
                    maxLength={24}
                  />
                </div>
                <div className="ads-field">
                  <label htmlFor="ad-deeplink">Deep link / route</label>
                  <input
                    id="ad-deeplink"
                    value={placement.deepLink || ''}
                    onChange={(e) => updateField('deepLink', e.target.value)}
                    placeholder="qglide://promo/summer"
                  />
                </div>
              </div>
            </div>

            <div className="ads-actions">
              <button
                type="button"
                className="ads-btn ads-btn-secondary"
                onClick={() => {
                  setConfig((prev) => ({
                    ...prev,
                    placements: {
                      ...prev.placements,
                      [selectedId]: {
                        slotId: selectedId,
                        headline: '',
                        body: '',
                        imageUrl: '',
                        ctaText: 'Learn more',
                        deepLink: '',
                        active: false,
                        updatedAt: null,
                      },
                    },
                  }));
                }}
                disabled={saving}
              >
                Reset slot
              </button>
              <button
                type="button"
                className="ads-btn ads-btn-primary"
                onClick={handleSavePlacement}
                disabled={saving}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {saving ? 'hourglass_empty' : 'rocket_launch'}
                </span>
                {saving ? 'Publishing…' : 'Publish placement'}
              </button>
            </div>
          </div>

          <div className="ads-device-wrap">
            <div className="ads-device-label">Live preview</div>
            <div className="ads-phone">
              <div className="ads-phone-notch" />
              <PhonePreview slotDef={slotDef} placement={placement} />
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={5000} />
      )}
    </div>
  );
}
