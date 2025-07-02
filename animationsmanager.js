var DEFAULT_SCROLL_OPTIONS = { root: null, rootMargin: '0px', threshold: 0.1 };

  function getAnimationOptions(element, overrides) {
    var opts = {
      delay: parseInt(element.dataset.animationDelay, 10) || 0,
      duration: parseInt(element.dataset.animationDuration, 10) || 1000,
      easing: element.dataset.animationEasing || 'ease',
      iteration: parseInt(element.dataset.animationIteration, 10) || 1,
      direction: element.dataset.animationDirection || 'normal',
      fillMode: element.dataset.animationFillMode || 'forwards',
      playState: element.dataset.animationPlayState || 'running',
      cleanup: false
    };
    if (overrides) {
      Object.keys(overrides).forEach(function(key) {
        if (overrides[key] !== undefined) {
          opts[key] = overrides[key];
        }
      });
    }
    return opts;
  }

  function initAnimations(config) {
    if (!config) config = {};
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-animation]'));
    var timed = all.filter(function(el) { return el.dataset.animationTrigger === 'timed'; });
    var scroll = all.filter(function(el) { return el.dataset.animationTrigger !== 'timed'; });
    triggerScrollAnimations(scroll, config.scrollObserverOptions);
    triggerTimedAnimations(timed);
  }

  function triggerScrollAnimations(elements, observerOptions) {
    if (!elements || !elements.length) return;
    var options = Object.assign({}, DEFAULT_SCROLL_OPTIONS, observerOptions);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var type = el.dataset.animation;
            var opts = getAnimationOptions(el);
            applyAnimation(el, type, opts);
            observer.unobserve(el);
          }
        });
      }, options);
      elements.forEach(function(el) { observer.observe(el); });
    } else {
      var remaining = elements.slice();
      function scrollHandler() {
        for (var i = 0; i < remaining.length; i++) {
          var el = remaining[i];
          var thresholdVal = Array.isArray(options.threshold) ? options.threshold[0] : options.threshold;
          if (isInViewport(el, thresholdVal)) {
            var type = el.dataset.animation;
            var opts = getAnimationOptions(el);
            applyAnimation(el, type, opts);
            remaining.splice(i, 1);
            i--;
          }
        }
        if (!remaining.length) {
          window.removeEventListener('scroll', throttledScroll);
        }
      }
      var throttledScroll = throttle(scrollHandler, 100);
      window.addEventListener('scroll', throttledScroll, { passive: true });
      throttledScroll();
    }
  }

  function triggerTimedAnimations(elements) {
    if (!elements || !elements.length) return;
    elements.forEach(function(el) {
      var time = parseInt(el.dataset.animationTime, 10);
      if (isNaN(time)) {
        time = parseInt(el.dataset.animationDelay, 10) || 0;
      }
      var type = el.dataset.animation;
      var opts = getAnimationOptions(el);
      setTimeout(function() {
        applyAnimation(el, type, opts);
      }, time);
    });
  }

  function applyAnimation(element, animationType, options) {
    if (!element || !animationType) return;
    var duration = options.duration;
    var delay = options.delay;
    var easing = options.easing;
    var iteration = options.iteration;
    var direction = options.direction;
    var fillMode = options.fillMode;
    var playState = options.playState;
    var cleanup = options.cleanup === true;
    var anim = animationType + ' ' + duration + 'ms ' + easing + ' ' + delay + 'ms ' + iteration + ' ' + direction + ' ' + fillMode + ' ' + playState;
    element.style.animation = anim;
    function handler() {
      if (cleanup) {
        element.style.animation = '';
      }
      element.dispatchEvent(new CustomEvent('animationComplete', { detail: { animationType: animationType } }));
      element.removeEventListener('animationend', handler);
    }
    element.addEventListener('animationend', handler);
  }

  function isInViewport(el, threshold) {
    var rect = el.getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    var thresholdPx = threshold * windowHeight;
    return rect.top <= windowHeight - thresholdPx && rect.bottom >= thresholdPx;
  }

  function throttle(fn, wait) {
    var last = 0;
    return function() {
      var now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  var Manager = {
    initAnimations: initAnimations,
    triggerScrollAnimations: triggerScrollAnimations,
    triggerTimedAnimations: triggerTimedAnimations,
    applyAnimation: applyAnimation
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() { Manager.initAnimations(); });
  }

  window.animationsManager = Manager;
})();