import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared empty state used across module pages. `actions` are objects with
 * either `{ to, label, variant }` (Link) or `{ onClick, label, variant }` (button).
 */
const BTN_VARIANTS = {
  primary: 'neo-btn-primary',
  secondary: 'neo-btn-secondary',
  blue: 'neo-btn-blue',
  green: 'neo-btn-green',
  yellow: 'neo-btn-yellow',
};

const EmptyState = ({ icon, iconColor = 'neo-icon-blue', title, description, actions = [] }) => (
  <div className="neo-card text-center py-20 px-6 neo-animate-in">
    <div className={`neo-icon ${iconColor} mx-auto mb-6`} style={{ width: '76px', height: '76px', fontSize: '2.25rem' }}>
      <span>{icon}</span>
    </div>
    <h3 className="neo-title text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    {actions.length > 0 && (
      <div className="flex flex-wrap justify-center gap-3">
        {actions.map((action, index) => {
          const cls = `neo-btn ${BTN_VARIANTS[action.variant] || 'neo-btn-secondary'}`;
          if (action.to) {
            return (
              <Link key={index} to={action.to} className={cls}>
                {action.label}
              </Link>
            );
          }
          return (
            <button key={index} onClick={action.onClick} className={cls}>
              {action.label}
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default EmptyState;
