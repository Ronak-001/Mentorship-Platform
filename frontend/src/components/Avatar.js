import React from 'react';
import './Avatar.css';

const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#0ea5e9', '#f59e0b'];

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return (name[0] || '?').toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  let n = 0;
  for (let i = 0; i < name.length; i++) n += name.charCodeAt(i);
  return avatarColors[Math.abs(n) % avatarColors.length];
};

/**
 * Avatar: shows profile image or initial letter(s) with styled background.
 * @param {string} name - User name (for initials when no src)
 * @param {string} src - Optional image URL
 * @param {string} className - Optional class (e.g. 'profile-picture' or 'user-avatar')
 * @param {string} size - 'sm' | 'md' | 'lg' for small/medium/large
 */
const Avatar = ({ name, src, className = '', size = 'md' }) => {
  const sizeClass = `avatar-${size}`;
  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={`avatar-img ${sizeClass} ${className}`} />;
  }
  return (
    <div
      className={`avatar-letter ${sizeClass} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${getAvatarColor(name)} 0%, ${getAvatarColor((name || '') + '1')} 100%)`,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
export { getInitials, getAvatarColor };
