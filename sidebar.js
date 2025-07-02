const ACTIVE_CLASS = 'active';
  const HIDDEN_CLASS = 'hidden';
  const STORAGE_KEY = 'activeSidebarTab';
  let tabButtons = [];
  let tabPanels = [];

  function initSidebar() {
    tabButtons = Array.from(document.querySelectorAll('[data-sidebar-tab]'));
    tabPanels = Array.from(document.querySelectorAll('[data-sidebar-panel]'));
    if (!tabButtons.length || !tabPanels.length) return;
    tabButtons.forEach(btn => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
    });
    tabPanels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.add(HIDDEN_CLASS);
    });
    const tabList = document.querySelector('[data-sidebar-tablist]');
    if (tabList) {
      tabList.setAttribute('role', 'tablist');
      tabList.addEventListener('click', event => {
        const btn = event.target.closest('[data-sidebar-tab]');
        if (btn && tabButtons.includes(btn)) {
          event.preventDefault();
          toggleTab(btn.dataset.sidebarTab);
        }
      });
      tabList.addEventListener('keydown', onKeydownTablist);
    } else {
      tabButtons.forEach(btn => {
        btn.addEventListener('click', event => {
          event.preventDefault();
          toggleTab(btn.dataset.sidebarTab);
        });
        btn.addEventListener('keydown', onKeydownTablist);
      });
    }
    const lastTab = window.localStorage.getItem(STORAGE_KEY);
    const defaultTab = lastTab && tabButtons.some(btn => btn.dataset.sidebarTab === lastTab)
      ? lastTab
      : tabButtons[0].dataset.sidebarTab;
    toggleTab(defaultTab, false);
  }

  function toggleTab(tabName, setFocus = true) {
    if (!tabName || !tabPanels.length || !tabButtons.length) return;
    let found = false;
    tabPanels.forEach(panel => {
      if (panel.dataset.sidebarPanel === tabName) {
        panel.classList.remove(HIDDEN_CLASS);
        panel.setAttribute('aria-hidden', 'false');
        found = true;
      } else {
        panel.classList.add(HIDDEN_CLASS);
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    if (!found) return;
    highlightActiveTab(tabName);
    if (setFocus) {
      const activeBtn = tabButtons.find(btn => btn.dataset.sidebarTab === tabName);
      if (activeBtn) activeBtn.focus();
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, tabName);
    } catch (e) {
      console.error('Failed to save active tab to localStorage', e);
    }
  }

  function highlightActiveTab(tabName) {
    if (!tabButtons.length) return;
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.sidebarTab === tabName;
      if (isActive) {
        btn.classList.add(ACTIVE_CLASS);
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
      } else {
        btn.classList.remove(ACTIVE_CLASS);
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
      }
    });
  }

  function onKeydownTablist(event) {
    const { key } = event;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const currentBtn = event.target.closest('[data-sidebar-tab]');
    if (!currentBtn) return;
    const currentIndex = tabButtons.indexOf(currentBtn);
    if (currentIndex === -1) return;
    let newIndex;
    const lastIndex = tabButtons.length - 1;
    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % tabButtons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = lastIndex;
        break;
      default:
        return;
    }
    const newBtn = tabButtons[newIndex];
    if (newBtn) {
      toggleTab(newBtn.dataset.sidebarTab);
    }
  }

  window.initSidebar = initSidebar;
  window.toggleTab = toggleTab;
  window.highlightActiveTab = highlightActiveTab;
  document.addEventListener('DOMContentLoaded', initSidebar);
})(window, document);