(function() {
  // Disable automatic scroll restoration so our custom behavior isn't overridden
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }

  let menuToggle, navMenu;
  const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
  let focusableElements = [];
  let firstFocusableElement = null;
  let lastFocusableElement = null;
  let previousActiveElement = null;
  const defaultRoute = '';

  function getCurrentRoute() {
    return location.hash.replace(/^#/, '');
  }

  function handleFocusTrap(event) {
    if (event.key !== 'Tab') return;
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey) {
      if (document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      }
    } else {
      if (document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }
  }

  function trapFocus(container) {
    previousActiveElement = document.activeElement;
    focusableElements = Array.from(container.querySelectorAll(focusableSelector))
      .filter(el => el.offsetParent !== null);
    firstFocusableElement = focusableElements[0] || null;
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null;
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
    document.addEventListener('keydown', handleFocusTrap);
  }

  function releaseFocus() {
    document.removeEventListener('keydown', handleFocusTrap);
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
    previousActiveElement = null;
    focusableElements = [];
    firstFocusableElement = null;
    lastFocusableElement = null;
  }

  function initHeaderNav() {
    console.log('[headernav] initHeaderNav running');
    menuToggle = document.querySelector('[data-nav-toggle]');
    navMenu = document.querySelector('[data-nav-menu]');
    console.log('[headernav] toggle:', menuToggle);
    console.log('[headernav] menu:', navMenu);
    if (!menuToggle || !navMenu) return;
    if (!menuToggle.id) {
      menuToggle.id = `nav-toggle-${Date.now()}`;
    }
    if (!navMenu.id) {
      navMenu.id = `nav-menu-${Date.now()}`;
    }
    menuToggle.setAttribute('aria-controls', navMenu.id);
    if (!menuToggle.hasAttribute('aria-expanded')) {
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    menuToggle.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    const links = navMenu.querySelectorAll('a[href]');
    links.forEach(link => {
      if (link.getAttribute('href').startsWith('#')) {
        link.addEventListener('click', event => {
          event.preventDefault();
          const route = link.getAttribute('href').slice(1);
          navigateTo(route, true, true);
          if (menuToggle.getAttribute('aria-expanded') === 'true') {
            toggleMobileMenu();
          }
        });
      }
    });
    highlightActiveLink();
    showDashboardLinkIfLoggedIn();
  }

  function highlightActiveLink() {
    if (!navMenu) return;
    const path = location.pathname.split('/').pop() || 'index.html';
    const links = navMenu.querySelectorAll('a[href]');
    links.forEach(function(link) {
      const href = link.getAttribute('href');
      const file = href.split('/').pop();
      if (file === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function showDashboardLinkIfLoggedIn() {
    if (!navMenu) return;
    const dashboardItem = navMenu.querySelector('[data-dashboard-link]');
    if (!dashboardItem) return;
    const hasToken = document.cookie.split(';').some(c => c.trim().startsWith('authToken='));
    dashboardItem.style.display = hasToken ? '' : 'none';
  }

  function navigateTo(route, shouldPush = true, shouldScroll = true) {
    if (shouldScroll) {
      smoothScrollTo(route);
      if (shouldPush) {
        history.pushState({ route }, '', `#${route}`);
      }
    } else if (shouldPush) {
      history.replaceState({ route }, '', `#${route}`);
    }
  }

  function toggleMobileMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    menuToggle.classList.toggle('is-open');
    navMenu.classList.toggle('is-open');
    if (!isExpanded) {
      trapFocus(navMenu);
    } else {
      releaseFocus();
    }
  }

  function smoothScrollTo(targetId, behavior = 'smooth') {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;
    const header = document.querySelector('header');
    const offset = header ? header.offsetHeight : 0;
    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior });
  }

  function handleDocumentClick(event) {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;
    if (navMenu.contains(event.target) || menuToggle.contains(event.target)) return;
    toggleMobileMenu();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      toggleMobileMenu();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderNav();
    const initRoute = getCurrentRoute() || defaultRoute;
    navigateTo(initRoute, false, false);
  });

  window.addEventListener('popstate', e => {
    const route = (e.state && e.state.route) || getCurrentRoute() || defaultRoute;
    navigateTo(route, false, true);
  });
})();
