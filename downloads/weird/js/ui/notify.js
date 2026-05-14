// SEX SLAVE DUNGEON — toast notifications.

(function () {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'ssd-notify-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '20px', right: '20px',
      zIndex: '1000', display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
    });
    document.body.appendChild(container);
    return container;
  }

  function show(text, { type = 'info', durationMs = 5000 } = {}) {
    ensureContainer();
    const toast = document.createElement('div');
    toast.className = `ssd-toast ${type}`;
    toast.textContent = text;
    Object.assign(toast.style, {
      padding: '12px 16px', borderRadius: '8px',
      background: type === 'error' ? '#3a1a14' : type === 'success' ? '#1a3a22' : '#22182c',
      border: `1px solid ${type === 'error' ? '#e14b3f' : type === 'success' ? '#53d68a' : '#3a2a4a'}`,
      color: '#eee2f2', fontSize: '0.9rem', maxWidth: '340px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'auto',
      animation: 'ssd-toast-in 0.3s ease-out'
    });
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  }

  window.SSDNotify = Object.freeze({ show });
})();
