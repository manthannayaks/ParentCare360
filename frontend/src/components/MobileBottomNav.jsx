import React from 'react';

export default function MobileBottomNav({ tabs, activeTab, onSelectTab }) {
  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            title={tab.label}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} />
              {tab.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '1px 5px',
                    fontSize: '9px',
                    fontWeight: 800,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
