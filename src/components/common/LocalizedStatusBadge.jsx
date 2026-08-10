import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const defaultGetStatusClass = (status) => {
  const normalized = String(status || 'pending').toLowerCase();
  return `status-${normalized.replace(/\s+/g, '-')}`;
};

export default function LocalizedStatusBadge({
  status,
  className = 'status-badge',
  getStatusClass = defaultGetStatusClass,
}) {
  const { translateApiLabel } = useLanguage();
  const statusClass = getStatusClass(status);

  return (
    <span className={`${className} ${statusClass}`}>
      {translateApiLabel(status || 'pending')}
    </span>
  );
}
