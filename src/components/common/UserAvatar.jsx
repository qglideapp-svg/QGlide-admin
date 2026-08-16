import React, { useState } from 'react';
import './UserAvatar.css';

function getUserInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export const hasProfilePicture = (src) => {
  if (!src || typeof src !== 'string') return false;
  return src.trim().length > 0;
};

export default function UserAvatar({
  src,
  name = '',
  alt,
  className = 'user-avatar',
}) {
  const [imgError, setImgError] = useState(false);
  const displayName = name || alt || 'User';
  const showImage = hasProfilePicture(src) && !imgError;

  if (showImage) {
    return (
      <img
        src={src}
        alt={alt || displayName}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`avatar-fallback ${className}`} aria-label={alt || displayName} role="img">
      {getUserInitials(displayName)}
    </div>
  );
}
