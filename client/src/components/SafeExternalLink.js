import React from 'react';
import { safeExternalUrl } from '../utils/safeUrl';

/**
 * Renders an <a target="_blank" rel="noopener noreferrer"> for safe http(s)
 * URLs. If the URL is missing/unsafe (e.g. javascript:, data:, malformed), it
 * renders a muted, non-clickable span instead — preventing stored-XSS via
 * saved links without breaking the layout.
 */
const SafeExternalLink = ({ href, children, className, style, onClick, title }) => {
  const safe = safeExternalUrl(href);

  if (!safe) {
    return (
      <span
        className={className}
        style={{ ...style, opacity: 0.55, cursor: 'not-allowed' }}
        title={title || 'Unavailable link'}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={onClick}
      title={title}
    >
      {children}
    </a>
  );
};

export default SafeExternalLink;
