(() => {
  const DEFAULT_REFRESH_INTERVAL = 10000;
  let counters = [];
  let refreshIntervalId = null;

  function initDashboard() {
    if (refreshIntervalId !== null) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }

    counters = Array.from(document.querySelectorAll('.counter[data-metric]'));
    if (counters.length === 0) return;

    attachEventListeners();
    dashboardUpdateMetrics();

    const dashboardEl = document.getElementById('dashboard');
    let interval = DEFAULT_REFRESH_INTERVAL;
    if (dashboardEl && dashboardEl.dataset.refreshInterval) {
      const parsed = parseInt(dashboardEl.dataset.refreshInterval, 10);
      if (!isNaN(parsed) && parsed > 0) {
        interval = parsed;
      }
    }
    refreshIntervalId = setInterval(dashboardUpdateMetrics, interval);
  }

  function attachEventListeners() {
    const refreshBtn = document.getElementById('refresh-metrics');
    if (refreshBtn) {
      refreshBtn.removeEventListener('click', dashboardUpdateMetrics);
      refreshBtn.addEventListener('click', dashboardUpdateMetrics);
    }
  }

  function dashboardUpdateMetrics() {
    const metrics = generateFakeMetrics();
    renderCounters(metrics);
  }

  function generateFakeMetrics() {
    const data = {};
    counters.forEach(el => {
      const key = el.dataset.metric;
      const rawMin = parseFloat(el.dataset.min);
      const min = !isNaN(rawMin) ? rawMin : 0;
      const rawMax = parseFloat(el.dataset.max);
      const max = (!isNaN(rawMax) && rawMax >= min) ? rawMax : min + 1000;

      let decimals = 0;
      if ('decimals' in el.dataset) {
        const rawDecimals = parseInt(el.dataset.decimals, 10);
        decimals = (Number.isInteger(rawDecimals) && rawDecimals >= 0) ? rawDecimals : 0;
      }

      let value = Math.random() * (max - min) + min;
      if (decimals > 0) {
        value = parseFloat(value.toFixed(decimals));
      } else {
        value = Math.floor(value);
      }
      data[key] = value;
    });
    return data;
  }

  function renderCounters(metrics) {
    counters.forEach(el => {
      const key = el.dataset.metric;
      const newValue = metrics[key];
      if (typeof newValue === 'undefined') return;

      let duration = 1000;
      if ('duration' in el.dataset) {
        const rawDuration = parseInt(el.dataset.duration, 10);
        if (!isNaN(rawDuration) && rawDuration >= 0) {
          duration = rawDuration;
        }
      }

      let decimals = 0;
      if ('decimals' in el.dataset) {
        const rawDecimals = parseInt(el.dataset.decimals, 10);
        decimals = (Number.isInteger(rawDecimals) && rawDecimals >= 0) ? rawDecimals : 0;
      }

      dashboardAnimateValue(el, newValue, duration, decimals);
    });
  }

  function dashboardAnimateValue(el, endValue, duration, decimals) {
    const currentText = el.textContent.replace(/,/g, '');
    const startValue = parseFloat(currentText) || 0;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = startValue + (endValue - startValue) * progress;
      el.textContent = dashboardFormatNumber(value, decimals);
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  function dashboardFormatNumber(value, decimals) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
})();