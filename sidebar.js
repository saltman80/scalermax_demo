(function() {
var sidebarContainerSelector = '#sidebar';
  var sidebarItemSelector = '.sidebar-item[data-route]';
  var sectionSelector = '[data-route-section]';
  var activeClass = 'active';
  var hiddenClass = 'hidden';
  var defaultRoute = '';
  var cachedItems = [];
  var cachedSections = [];

  function normalizeRoute(route) {
    if (!route) return '';
    return route.toString().replace(/^#/, '').replace(/^\//, '');
  }

  function getCurrentRoute() {
    var hash = location.hash.slice(1);
    var normalizedHash = normalizeRoute(hash);
    if (normalizedHash) return normalizedHash;
    return normalizeRoute(location.pathname);
  }

  function initSidebar() {
    var sidebar = document.querySelector(sidebarContainerSelector);
    if (!sidebar) return;

    var itemsNodeList = sidebar.querySelectorAll(sidebarItemSelector);
    var items = Array.prototype.slice.call(itemsNodeList);
    if (!items.length) return;

    // Find first valid non-empty route
    var validRoutes = items.map(function(item){
      return normalizeRoute(item.getAttribute('data-route'));
    }).filter(function(r){ return r; });
    if (!validRoutes.length) {
      console.warn('Sidebar: no valid data-route attributes found on sidebar items.');
      return;
    }
    defaultRoute = validRoutes[0];

    // Cache items and sections
    cachedItems = items;
    var sectionsNodeList = document.querySelectorAll(sectionSelector);
    cachedSections = Array.prototype.slice.call(sectionsNodeList);

    // Click navigation
    sidebar.addEventListener('click', function(e){
      var item = e.target.closest(sidebarItemSelector);
      if (item && sidebar.contains(item)) {
        e.preventDefault();
        var route = item.getAttribute('data-route');
        navigateTo(route);
      }
    });

    // Browser navigation (back/forward)
    window.addEventListener('popstate', function(e){
      var route = e.state && e.state.route ? e.state.route : getCurrentRoute();
      navigateTo(route, false);
    });

    // Initial navigation
    var initRoute = getCurrentRoute() || defaultRoute;
    navigateTo(initRoute, false);
  }

  function navigateTo(route, pushState) {
    if (pushState === undefined) pushState = true;
    route = normalizeRoute(route) || defaultRoute;

    // Show/hide sections
    cachedSections.forEach(function(sec){
      var secRoute = normalizeRoute(sec.getAttribute('data-route-section'));
      var isVisible = secRoute === route;
      sec.classList.toggle(hiddenClass, !isVisible);
    });

    // Toggle active class on items
    cachedItems.forEach(function(item){
      var itemRoute = normalizeRoute(item.getAttribute('data-route'));
      var isActive = itemRoute === route;
      item.classList.toggle(activeClass, isActive);
    });

    // Update URL hash
    if (pushState) {
      var encodedRoute = encodeURIComponent(route);
      var url = '#' + encodedRoute;
      if (location.hash !== url) {
        history.pushState({ route: route }, '', url);
      }
    }
  }

  window.Sidebar = {
    initSidebar: initSidebar,
    navigateTo: navigateTo
  };

  document.addEventListener('DOMContentLoaded', initSidebar);
})();
