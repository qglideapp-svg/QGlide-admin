import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdsManagementView.css';
import { logoutUser } from '../../services/authService';
import {
  PLACEMENT_SLOTS,
  DRIVER_PLACEMENT_SLOTS,
  loadAdConfig,
  persistAdConfigLocal,
  publishAdPlacement,
  saveAdPlacementDraft,
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

function PhonePreview({ slotDef, placement, audience }) {
  const isDriver = audience === 'driver';
  const headline = placement.headline?.trim() || 'Your headline';
  const body =
    placement.body?.trim() ||
    (isDriver ? 'Short supporting copy drivers see under the headline.' : 'Short supporting copy for riders.');
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
          <div className="success-chip">
            {isDriver ? 'Trip complete · Nice work' : 'Trip complete · Thanks for riding'}
          </div>
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
          <span>{isDriver ? 'Driver' : 'Account'}</span>
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

  if (slotDef.preview === 'wallet') {
    return (
      <div className="ads-phone-screen">
        <div className="ads-mock-header">
          <span>9:41</span>
          <span>Wallet</span>
          <span>●●●</span>
        </div>
        <div className={previewClass}>
          <div className="ads-wallet-mock">
            <div className="ads-wallet-balance">
              <span className="ads-wallet-label">{isDriver ? 'Available' : 'Balance'}</span>
              <span className="ads-wallet-amount">{isDriver ? '$182.40' : '$24.50'}</span>
            </div>
            <div className="ads-wallet-actions">
              <span className="ads-wallet-chip">{isDriver ? 'Cash out' : 'Add funds'}</span>
              <span className="ads-wallet-chip muted">History</span>
            </div>
          </div>
          {creative}
        </div>
      </div>
    );
  }

  if (slotDef.preview === 'strip') {
    return (
      <div className="ads-phone-screen">
        <div className="ads-mock-header">
          <span>9:41</span>
          <span>{isDriver ? 'Requests' : 'Book a ride'}</span>
          <span>●●●</span>
        </div>
        <div className={previewClass}>
          <div className="ads-mock-map">
            <div className="ads-mock-pin" />
          </div>
          {creative}
          <div className="ads-mock-cta">{isDriver ? 'Go online' : 'Request ride'}</div>
        </div>
      </div>
    );
  }

  /* hero */
  return (
    <div className="ads-phone-screen">
      <div className="ads-mock-header">
        <span>9:41</span>
        <span>{isDriver ? 'Map' : 'Home'}</span>
        <span>●●●</span>
      </div>
      <div className={previewClass}>
        {creative}
        <div className="ads-mock-map">
          <div className="ads-mock-pin" />
        </div>
        <div className="ads-mock-cta">{isDriver ? 'Start driving' : 'Where to?'}</div>
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
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [audience, setAudience] = useState('rider');
  const [selectedId, setSelectedId] = useState(PLACEMENT_SLOTS[0].id);
  const [config, setConfig] = useState(() => loadAdConfig().data);

  const slots = audience === 'rider' ? PLACEMENT_SLOTS : DRIVER_PLACEMENT_SLOTS;
  const placementsKey = audience === 'rider' ? 'placements' : 'driverPlacements';

  useEffect(() => {
    const r = loadAdConfig();
    if (r.success) setConfig(r.data);
  }, []);

  const slotDef = useMemo(
    () => slots.find((s) => s.id === selectedId) || slots[0],
    [selectedId, slots],
  );

  const placementMap =
    audience === 'rider' ? config.placements ?? {} : config.driverPlacements ?? {};
  const placement = placementMap[selectedId] || {};

  const publishedCount = useMemo(
    () => Object.values(placementMap).filter((p) => p.publishedAt).length,
    [placementMap],
  );

  const lastPublishedForAudience =
    audience === 'rider' ? config.lastPublishedAt : config.lastDriverPublishedAt;

  const switchAudience = (next) => {
    setAudience(next);
    setSelectedId(next === 'rider' ? PLACEMENT_SLOTS[0].id : DRIVER_PLACEMENT_SLOTS[0].id);
  };

  const updateField = useCallback(
    (field, value) => {
      const key = audience === 'rider' ? 'placements' : 'driverPlacements';
      setConfig((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [selectedId]: {
            ...prev[key][selectedId],
            [field]: value,
          },
        },
      }));
    },
    [selectedId, audience],
  );

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
      setToast({ type: 'error', message: 'Add a headline before saving this placement.' });
      return;
    }
    setSavingDraft(true);
    const result = await saveAdPlacementDraft(selectedId, placement);
    setSavingDraft(false);
    if (result.success) {
      const next = {
        ...config,
        [placementsKey]: {
          ...config[placementsKey],
          [selectedId]: {
            ...placement,
            updatedAt: new Date().toISOString(),
          },
        },
      };
      setConfig(next);
      persistAdConfigLocal(next);
      setToast({ type: 'success', message: 'Placement saved (draft on server).' });
    } else {
      setToast({ type: 'error', message: result.error || 'Could not save.' });
    }
  };

  const handlePublishPlacement = async () => {
    if (!placement.headline?.trim()) {
      setToast({ type: 'error', message: 'Add a headline before publishing this placement.' });
      return;
    }
    setPublishing(true);
    const saveResult = await saveAdPlacementDraft(selectedId, placement);
    if (!saveResult.success) {
      setPublishing(false);
      setToast({ type: 'error', message: saveResult.error || 'Save failed before publish.' });
      return;
    }
    const pubResult = await publishAdPlacement(selectedId);
    setPublishing(false);
    if (pubResult.success) {
      const now = new Date().toISOString();
      const next = {
        ...config,
        ...(audience === 'rider' ? { lastPublishedAt: now } : { lastDriverPublishedAt: now }),
        [placementsKey]: {
          ...config[placementsKey],
          [selectedId]: {
            ...placement,
            publishedAt: now,
            updatedAt: now,
          },
        },
      };
      setConfig(next);
      persistAdConfigLocal(next);
      setToast({
        type: 'success',
        message:
          audience === 'driver'
            ? 'Published. The driver app can load this placement now.'
            : 'Published. The rider app can load this placement now.',
      });
    } else {
      setToast({ type: 'error', message: pubResult.error || 'Could not publish.' });
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
              <p className="sub">
                {audience === 'driver'
                  ? 'Design placements for the driver app — same workflow as rider ads'
                  : 'Design placements that riders see inside the mobile app'}
              </p>
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

        <section
          className={`ads-hero-band ${audience === 'driver' ? 'ads-hero-band--driver' : ''}`}
          aria-label="Overview"
        >
          <div className="ads-hero-inner">
            <div>
              <div className="ads-hero-badge">
                <span className="material-symbols-outlined">{audience === 'driver' ? 'badge' : 'hub'}</span>
                {audience === 'driver' ? 'Driver partner app' : 'Rider app'}
              </div>
              <h2>{audience === 'driver' ? 'Driver ad studio' : 'Rider ad studio'}</h2>
              <p>
                {audience === 'driver'
                  ? 'Reach drivers in-context: home map, requests strip, post-trip, and account. Save a draft, then publish so the driver build picks it up from the same ad-placement API using driver placement keys.'
                  : 'Pick a screen moment, drop in creative and a deep link, then publish. Each slot maps to a native placement in the rider app for a consistent, on-brand experience.'}
              </p>
            </div>
          </div>
        </section>

        <div className="ads-stats">
          <div className="ads-stat-card">
            <div className="k">Live placements</div>
            <div className="v">{publishedCount}</div>
            <div className="hint">Published to the app via Ad placement API</div>
          </div>
          <div className="ads-stat-card">
            <div className="k">Audience</div>
            <div className="v">{audience === 'driver' ? 'Drivers' : 'Riders'}</div>
            <div className="hint">
              {audience === 'driver'
                ? 'Placements use driver_* keys on the same API'
                : 'Same payload for every signed-in rider (per slot rules)'}
            </div>
          </div>
          <div className="ads-stat-card">
            <div className="k">Last publish</div>
            <div className="v" style={{ fontSize: '0.95rem' }}>
              {lastPublishedForAudience ? new Date(lastPublishedForAudience).toLocaleString() : '—'}
            </div>
            <div className="hint">From your last successful publish action</div>
          </div>
        </div>

        <div className="ads-studio">
          <div className="ads-audience-bar" role="tablist" aria-label="Ad target app">
            <span className="ads-audience-label">Target</span>
            <div className="ads-audience-toggle">
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'rider'}
                className={audience === 'rider' ? 'on' : ''}
                onClick={() => switchAudience('rider')}
              >
                <span className="material-symbols-outlined">person</span>
                Rider app
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'driver'}
                className={audience === 'driver' ? 'on' : ''}
                onClick={() => switchAudience('driver')}
              >
                <span className="material-symbols-outlined">local_taxi</span>
                Driver app
              </button>
            </div>
          </div>

          <div className="ads-slot-list">
            {slots.map((slot) => {
              const p = placementMap[slot.id];
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
                      <span className={`ads-pill ${p?.publishedAt ? '' : 'off'}`}>
                        {p?.publishedAt ? 'Live' : 'Draft'}
                      </span>
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
                <span>{audience === 'driver' ? 'Show to all drivers on this screen' : 'Show to all users on this screen'}</span>
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
                  placeholder={
                    audience === 'driver'
                      ? 'One or two lines drivers see under the headline'
                      : 'One or two lines riders see under the headline'
                  }
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
                    placeholder={
                      audience === 'driver'
                        ? 'qglide://driver/promo/summer'
                        : selectedId === 'rider_wallet'
                          ? 'qglide://wallet/promo'
                          : 'qglide://promo/summer'
                    }
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
                    [placementsKey]: {
                      ...prev[placementsKey],
                      [selectedId]: {
                        slotId: selectedId,
                        headline: '',
                        body: '',
                        imageUrl: '',
                        ctaText: 'Learn more',
                        deepLink: '',
                        active: false,
                        updatedAt: null,
                        publishedAt: null,
                      },
                    },
                  }));
                }}
                disabled={savingDraft || publishing}
              >
                Reset slot
              </button>
              <button
                type="button"
                className="ads-btn ads-btn-secondary"
                onClick={handleSavePlacement}
                disabled={savingDraft || publishing}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {savingDraft ? 'hourglass_empty' : 'save'}
                </span>
                {savingDraft ? 'Saving…' : 'Save placement'}
              </button>
              <button
                type="button"
                className="ads-btn ads-btn-primary"
                onClick={handlePublishPlacement}
                disabled={savingDraft || publishing}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {publishing ? 'hourglass_empty' : 'rocket_launch'}
                </span>
                {publishing ? 'Publishing…' : 'Publish to app'}
              </button>
            </div>
          </div>

          <div className="ads-device-wrap">
            <div className="ads-device-label">
              Live preview · {audience === 'driver' ? 'Driver' : 'Rider'}
            </div>
            <div className="ads-phone">
              <div className="ads-phone-notch" />
              <PhonePreview slotDef={slotDef} placement={placement} audience={audience} />
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
