import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './LazyLoader.css';

const LazyLoader = ({
  variant = 'content',
  message,
  rows = 6,
  columns = 5,
  count = 4,
  lines = 4,
  size = 'md',
  fullScreen = false,
  className = '',
  as: Component = 'div',
}) => {
  const { t } = useLanguage();
  const label = message || t('common.loading');

  if (variant === 'inline') {
    return (
      <Component className={`lazy-loader lazy-loader-inline lazy-loader-${size} ${className}`.trim()} role="status" aria-live="polite">
        <span className="lazy-loader-spinner" aria-hidden="true" />
        {label ? <span className="lazy-loader-label">{label}</span> : null}
      </Component>
    );
  }

  if (variant === 'page') {
    return (
      <Component className={`lazy-loader lazy-loader-page ${fullScreen ? 'lazy-loader-fullscreen' : ''} ${className}`.trim()} role="status" aria-live="polite">
        <div className="lazy-loader-page-inner">
          <span className="lazy-loader-spinner lazy-loader-spinner-lg" aria-hidden="true" />
          <p className="lazy-loader-label">{label}</p>
          <div className="lazy-loader-page-lines">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} className="lazy-loader-skeleton lazy-loader-skeleton-line" />
            ))}
          </div>
        </div>
      </Component>
    );
  }

  if (variant === 'cards') {
    return (
      <Component className={`lazy-loader lazy-loader-cards ${className}`.trim()} role="status" aria-live="polite">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="lazy-loader-card lazy-loader-skeleton">
            <span className="lazy-loader-skeleton lazy-loader-skeleton-title" />
            <span className="lazy-loader-skeleton lazy-loader-skeleton-value" />
            <span className="lazy-loader-skeleton lazy-loader-skeleton-sub" />
          </div>
        ))}
        <span className="lazy-loader-sr-only">{label}</span>
      </Component>
    );
  }

  if (variant === 'table') {
    return (
      <Component className={`lazy-loader lazy-loader-table-wrap ${className}`.trim()} role="status" aria-live="polite">
        <table className="lazy-loader-table">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index}>
                  <span className="lazy-loader-skeleton lazy-loader-skeleton-cell" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex}>
                    <span className="lazy-loader-skeleton lazy-loader-skeleton-cell" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <span className="lazy-loader-sr-only">{label}</span>
      </Component>
    );
  }

  if (variant === 'form') {
    return (
      <Component className={`lazy-loader lazy-loader-form ${className}`.trim()} role="status" aria-live="polite">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="lazy-loader-form-row">
            <span className="lazy-loader-skeleton lazy-loader-skeleton-label" />
            <span className="lazy-loader-skeleton lazy-loader-skeleton-input" />
          </div>
        ))}
        <span className="lazy-loader-sr-only">{label}</span>
      </Component>
    );
  }

  if (variant === 'ride-details') {
    return (
      <Component className={`lazy-loader lazy-loader-ride-details ${className}`.trim()} role="status" aria-live="polite">
        <div className="lazy-loader-ride-header">
          <span className="lazy-loader-skeleton lazy-loader-skeleton-toolbar" />
          <span className="lazy-loader-skeleton lazy-loader-skeleton-badge" />
        </div>
        <div className="lazy-loader-ride-grid">
          <div className="lazy-loader-ride-main">
            <div className="lazy-loader-skeleton lazy-loader-skeleton-map" />
            <div className="lazy-loader-skeleton lazy-loader-skeleton-panel" />
          </div>
          <div className="lazy-loader-ride-side">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="lazy-loader-skeleton lazy-loader-skeleton-side-card" />
            ))}
          </div>
        </div>
        <span className="lazy-loader-sr-only">{label}</span>
      </Component>
    );
  }

  return (
    <Component className={`lazy-loader lazy-loader-content ${className}`.trim()} role="status" aria-live="polite">
      <span className="lazy-loader-spinner" aria-hidden="true" />
      <p className="lazy-loader-label">{label}</p>
      <div className="lazy-loader-content-lines">
        {Array.from({ length: lines }).map((_, index) => (
          <span key={index} className="lazy-loader-skeleton lazy-loader-skeleton-line" />
        ))}
      </div>
    </Component>
  );
};

export default LazyLoader;
