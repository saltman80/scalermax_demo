(function(window){
var defaultOptions = {
    type: 'box',
    color: '#ffff00',
    blur: 20,
    spread: 0,
    duration: 1000,
    pulse: true,
    iterations: Infinity,
    easing: 'ease-in-out'
  };
  var baseStyleEl = null, styleSheet = null;
  var idCounter = 0;
  var elementMap = new WeakMap();
  var fallbackStyleMap = new Map();

  function initGlowEffects() {
    if (styleSheet) return;
    baseStyleEl = document.createElement('style');
    baseStyleEl.setAttribute('data-glow', '');
    document.head.appendChild(baseStyleEl);
    styleSheet = baseStyleEl.sheet;
  }

  function removeKeyframes(name) {
    if (!styleSheet) return;
    for (var i = styleSheet.cssRules.length - 1; i >= 0; i--) {
      var rule = styleSheet.cssRules[i];
      if (rule.name === name) {
        styleSheet.deleteRule(i);
      }
    }
    var fallbackEl = fallbackStyleMap.get(name);
    if (fallbackEl && fallbackEl.parentNode) {
      fallbackEl.parentNode.removeChild(fallbackEl);
    }
    fallbackStyleMap.delete(name);
  }

  function applyGlow(element, options) {
    initGlowEffects();
    if (!(element instanceof Element)) {
      throw new TypeError('applyGlow: first argument must be a DOM Element');
    }
    if (elementMap.has(element)) {
      removeKeyframes(elementMap.get(element));
    }
    var opts = Object.assign({}, defaultOptions, options);
    var typeProp = opts.type === 'text' ? 'text-shadow' : 'box-shadow';
    var color = opts.color;
    var blur = Number(opts.blur);
    if (isNaN(blur)) blur = defaultOptions.blur;
    var spread = Number(opts.spread);
    if (isNaN(spread)) spread = defaultOptions.spread;
    var duration = Number(opts.duration);
    if (isNaN(duration)) duration = defaultOptions.duration;
    var pulse = Boolean(opts.pulse);
    var iterations = opts.iterations != null ? opts.iterations : defaultOptions.iterations;
    var easing = opts.easing || defaultOptions.easing;
    var name = 'glow_' + (++idCounter);
    var startVal = '0 0 0px 0px ' + color;
    var midVal = '0 0 ' + blur + 'px ' + spread + 'px ' + color;
    var keyframes = pulse
      ? '0%{' + typeProp + ':' + startVal + ';}50%{' + typeProp + ':' + midVal + ';}100%{' + typeProp + ':' + startVal + ';}'
      : '0%{' + typeProp + ':' + startVal + ';}100%{' + typeProp + ':' + midVal + ';}';
    var ruleWebkit = '@-webkit-keyframes ' + name + '{' + keyframes + '}';
    var ruleStandard = '@keyframes ' + name + '{' + keyframes + '}';
    try {
      styleSheet.insertRule(ruleWebkit, styleSheet.cssRules.length);
      styleSheet.insertRule(ruleStandard, styleSheet.cssRules.length);
    } catch (e) {
      var fallbackEl = document.createElement('style');
      fallbackEl.setAttribute('data-glow-fallback', '');
      fallbackEl.setAttribute('data-glow-keyframes', name);
      fallbackEl.textContent = ruleWebkit + '\n' + ruleStandard;
      document.head.appendChild(fallbackEl);
      fallbackStyleMap.set(name, fallbackEl);
    }
    var iterValue = iterations === Infinity ? 'infinite' : iterations;
    var animationValue = name + ' ' + duration + 'ms ' + easing + ' ' + iterValue;
    element.style.setProperty('animation', animationValue);
    element.style.setProperty('-webkit-animation', animationValue);
    elementMap.set(element, name);
    return {
      removeGlow: function() {
        element.style.removeProperty('animation');
        element.style.removeProperty('-webkit-animation');
        removeKeyframes(name);
        elementMap.delete(element);
      },
      updateOptions: function(newOpts) {
        this.removeGlow();
        return applyGlow(element, Object.assign({}, opts, newOpts));
      }
    };
  }

  var Glow = {
    initGlowEffects: initGlowEffects,
    applyGlow: applyGlow
  };

  if (!window.Glow) {
    window.Glow = Glow;
  } else {
    window.Glow.initGlowEffects = initGlowEffects;
    window.Glow.applyGlow = applyGlow;
  }
})(window);
