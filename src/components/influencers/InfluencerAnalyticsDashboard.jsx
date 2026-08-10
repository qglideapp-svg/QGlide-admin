import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from '../common/LazyLoader.jsx';
import './InfluencerAnalytics.css';

function createPieSlice(startAngle, endAngle, radius = 80) {
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
}

function LineAreaChart({ data, color = '#7c3aed', height = 200, valueLabel = '' }) {
  const { path, areaPath, points, maxVal } = useMemo(() => {
    if (!data?.length) return { path: '', areaPath: '', points: [], maxVal: 1 };
    const w = 560;
    const h = height - 40;
    const padX = 24;
    const padY = 16;
    const max = Math.max(...data.map((d) => d.count), 1);
    const step = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: padX + i * step,
      y: padY + h - (d.count / max) * h,
      ...d,
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x} ${padY + h} L ${pts[0].x} ${padY + h} Z`;

    return { path: line, areaPath: area, points: pts, maxVal: max };
  }, [data, height]);

  if (!data?.length) {
    return <div className="inf-chart-empty">No data for this period</div>;
  }

  return (
    <div className="inf-line-chart">
      <svg viewBox={`0 0 560 ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={valueLabel}>
        <defs>
          <linearGradient id="infAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = 16 + (height - 40) * (1 - t);
          const val = Math.round(maxVal * t);
          return (
            <g key={t}>
              <line x1="24" y1={y} x2="536" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
              <text x="8" y={y + 4} fontSize="10" fill="#94a3b8">
                {val}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#infAreaGrad)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) =>
          i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? (
            <circle key={p.date} cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
          ) : null
        )}
      </svg>
      <div className="inf-line-chart-labels">
        {points
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
          .map((p) => (
            <span key={p.date}>{p.label}</span>
          ))}
      </div>
    </div>
  );
}

function VerticalBarChart({ data, color = '#8b5cf6' }) {
  if (!data?.length) return <div className="inf-chart-empty">No data</div>;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="inf-vbar-chart">
      {data.map((item) => (
        <div key={item.hour || item.label} className="inf-vbar-item">
          <div className="inf-vbar-track">
            <div
              className="inf-vbar-fill"
              style={{ height: `${(item.count / max) * 100}%`, backgroundColor: color }}
              title={`${item.count}`}
            />
          </div>
          <span className="inf-vbar-label">{item.hour || item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBarChart({ data, maxItems = 6 }) {
  const items = data.slice(0, maxItems);
  if (!items.length) return <div className="inf-chart-empty">No data</div>;
  const max = Math.max(...items.map((d) => d.referrals ?? d.count ?? 0), 1);

  return (
    <div className="inf-hbar-chart">
      {items.map((item) => {
        const val = item.referrals ?? item.count ?? 0;
        return (
          <div key={item.id || item.name} className="inf-hbar-row">
            <div className="inf-hbar-meta">
              <span className="inf-hbar-name">{item.name}</span>
              <span className="inf-hbar-val">{formatNumber(val)} referrals</span>
            </div>
            <div className="inf-hbar-track">
              <div className="inf-hbar-fill" style={{ width: `${(val / max) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ segments }) {
  if (!segments?.length) return <div className="inf-chart-empty">No data</div>;

  return (
    <div className="inf-donut-wrap">
      <svg className="inf-donut" viewBox="0 0 200 200" width="160" height="160">
        {segments.map((seg, index) => {
          const prev = segments.slice(0, index).reduce((s, v) => s + v.percentage, 0);
          const startAngle = (prev / 100) * 360;
          const endAngle = ((prev + seg.percentage) / 100) * 360;
          return <path key={seg.label} d={createPieSlice(startAngle, endAngle)} fill={seg.color} />;
        })}
        <circle cx="100" cy="100" r="36" fill="var(--card, #fff)" />
      </svg>
      <div className="inf-donut-legend">
        {segments.map((seg) => (
          <div key={seg.label} className="inf-legend-row">
            <span className="inf-legend-dot" style={{ backgroundColor: seg.color }} />
            <span className="inf-legend-label">{seg.label}</span>
            <span className="inf-legend-val">{formatNumber(seg.count)} ({seg.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon, iconClass, label, value, sub }) {
  return (
    <div className="inf-metric-card">
      <div className="inf-metric-top">
        <span className="inf-metric-label">{label}</span>
        <span className={`inf-metric-icon ${iconClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
      </div>
      <div className="inf-metric-value">{value}</div>
      {sub ? <div className="inf-metric-sub">{sub}</div> : null}
    </div>
  );
}

export default function InfluencerAnalyticsDashboard({
  data,
  isLoading,
  period,
  onPeriodChange,
  onInfluencerClick,
  t,
  showDemoBanner = false,
  compact = false,
}) {
  const { formatNumber, formatDateTime } = useLanguage();
  const summary = data?.summary;

  if (isLoading) {
    return (
      <LazyLoader variant="cards" count={4} message={t('influencers.analyticsLoading')} />
    );
  }

  if (!data) {
    return <div className="inf-analytics-empty">{t('influencers.analyticsNoData')}</div>;
  }

  const leaderboardRows = data.leaderboard?.length ? data.leaderboard : data.topInfluencers;

  return (
    <div className={`inf-analytics ${compact ? 'inf-analytics-compact' : ''}`}>
      <div className="inf-analytics-toolbar">
        <div className="inf-period-tabs" role="tablist" aria-label={t('influencers.periodLabel')}>
          {[
            { id: '7d', label: t('influencers.period7d') },
            { id: '30d', label: t('influencers.period30d') },
            { id: '90d', label: t('influencers.period90d') },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`inf-period-tab ${period === p.id ? 'active' : ''}`}
              onClick={() => onPeriodChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {showDemoBanner && data.isDemo ? (
          <div className="inf-demo-banner">
            <span className="material-symbols-outlined">info</span>
            {t('influencers.demoDataNotice')}
          </div>
        ) : null}
      </div>

      <section className="inf-metrics-grid">
        <MetricCard
          icon="group_add"
          iconClass="purple"
          label={t('influencers.metricTotalReferrals')}
          value={formatNumber(summary.totalReferrals)}
          sub={`${formatNumber(summary.referralsToday)} ${t('influencers.today')}`}
        />
        <MetricCard
          icon="calendar_month"
          iconClass="violet"
          label={t('influencers.metricReferralsMonth')}
          value={formatNumber(summary.referralsThisMonth)}
        />
        <MetricCard
          icon="login"
          iconClass="indigo"
          label={t('influencers.metricLoginsToday')}
          value={formatNumber(summary.loginsToday)}
        />
        <MetricCard
          icon="event_available"
          iconClass="blue"
          label={t('influencers.metricLoginsMonth')}
          value={formatNumber(summary.loginsThisMonth)}
        />
        <MetricCard
          icon="campaign"
          iconClass="fuchsia"
          label={t('influencers.metricActiveInfluencers')}
          value={formatNumber(summary.activeInfluencers)}
        />
        <MetricCard
          icon="trending_up"
          iconClass="green"
          label={t('influencers.metricConversion')}
          value={`${summary.conversionRate}%`}
          sub={t('influencers.metricConversionSub')}
        />
      </section>

      <section className="inf-charts-row inf-charts-row-2">
        <div className="inf-chart-panel inf-chart-panel-wide">
          <div className="inf-chart-header">
            <h3>{t('influencers.chartReferralsOverTime')}</h3>
            <span className="inf-chart-sub">{t('influencers.chartReferralsOverTimeSub')}</span>
          </div>
          <div className="inf-chart-body">
            <LineAreaChart
              data={data.referralsOverTime}
              color="#7c3aed"
              valueLabel={t('influencers.chartReferralsOverTime')}
            />
          </div>
        </div>
        <div className="inf-chart-panel">
          <div className="inf-chart-header">
            <h3>{t('influencers.chartLoginsOverTime')}</h3>
            <span className="inf-chart-sub">{t('influencers.chartLoginsOverTimeSub')}</span>
          </div>
          <div className="inf-chart-body">
            <LineAreaChart
              data={data.loginsOverTime}
              color="#6366f1"
              height={200}
              valueLabel={t('influencers.chartLoginsOverTime')}
            />
          </div>
        </div>
      </section>

      <section className="inf-charts-row inf-charts-row-3">
        <div className="inf-chart-panel">
          <div className="inf-chart-header">
            <h3>{t('influencers.chartLoginsByHour')}</h3>
          </div>
          <div className="inf-chart-body">
            <VerticalBarChart data={data.loginsByHour} color="#8b5cf6" />
          </div>
        </div>
        <div className="inf-chart-panel">
          <div className="inf-chart-header">
            <h3>{t('influencers.chartReferralStatus')}</h3>
          </div>
          <div className="inf-chart-body">
            <DonutChart segments={data.referralStatus} />
          </div>
        </div>
        <div className="inf-chart-panel">
          <div className="inf-chart-header">
            <h3>{t('influencers.chartTopInfluencers')}</h3>
          </div>
          <div className="inf-chart-body">
            <HorizontalBarChart data={data.topInfluencers} />
          </div>
        </div>
      </section>

      {!compact ? (
        <section className="inf-bottom-row">
          <div className="inf-chart-panel inf-leaderboard-panel">
            <div className="inf-chart-header">
              <h3>{t('influencers.leaderboardTitle')}</h3>
            </div>
            <div className="inf-chart-body inf-table-wrap">
              <table className="inf-leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('influencers.colName')}</th>
                    <th>{t('influencers.colReferrals')}</th>
                    <th>{t('influencers.colLogins')}</th>
                    <th>{t('influencers.colConversion')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leaderboardRows.map((inf, i) => (
                    <tr key={inf.id}>
                      <td className="inf-rank">{inf.rank ?? i + 1}</td>
                      <td>
                        <div className="inf-leader-name">{inf.name}</div>
                        <div className="inf-leader-email">{inf.email}</div>
                      </td>
                      <td>{formatNumber(inf.referrals)}</td>
                      <td>{formatNumber(inf.logins)}</td>
                      <td>
                        <span className="inf-conversion-pill">{inf.conversionRate}%</span>
                      </td>
                      <td>
                        {onInfluencerClick ? (
                          <button type="button" className="inf-view-btn" onClick={() => onInfluencerClick(inf.id)}>
                            {t('influencers.viewDetails')}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="inf-chart-panel inf-activity-panel">
            <div className="inf-chart-header">
              <h3>{t('influencers.recentActivity')}</h3>
            </div>
            <div className="inf-chart-body">
              <ul className="inf-activity-list">
                {(data.recentActivity || []).slice(0, 10).map((act) => (
                  <li key={act.id} className={`inf-activity-item inf-activity-${act.type}`}>
                    <span className="inf-activity-icon material-symbols-outlined">
                      {act.type === 'login' ? 'login' : 'person_add'}
                    </span>
                    <div className="inf-activity-body">
                      <strong>{act.influencer}</strong>
                      <span>{act.description}</span>
                      <time dateTime={act.timestamp}>
                        {formatDateTime(act.timestamp)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export { LineAreaChart, VerticalBarChart, HorizontalBarChart, DonutChart, MetricCard };
