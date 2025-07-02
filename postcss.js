function loadPostCSSPlugins(pluginSpecs) {
  if (!Array.isArray(pluginSpecs)) {
    throw new TypeError(`PostCSS plugins should be an array, got ${typeof pluginSpecs}`);
  }
  return pluginSpecs.map((spec, index) => {
    let pluginModule, pluginName, pluginOptions;
    if (typeof spec === 'string') {
      pluginName = spec;
    } else if (Array.isArray(spec)) {
      [pluginName, pluginOptions] = spec;
      if (typeof pluginName !== 'string') {
        throw new TypeError(`Invalid PostCSS plugin name at index ${index}: ${JSON.stringify(pluginName)}`);
      }
      if (pluginOptions !== undefined && (typeof pluginOptions !== 'object' || pluginOptions === null)) {
        throw new TypeError(`Invalid options for PostCSS plugin "${pluginName}" at index ${index}: expected an object, got ${typeof pluginOptions}`);
      }
    } else if (typeof spec === 'function') {
      return spec;
    } else if (spec && typeof spec === 'object' && spec.postcssPlugin) {
      return spec;
    } else {
      throw new TypeError(`Invalid PostCSS plugin specification at index ${index}: ${JSON.stringify(spec)}`);
    }
    try {
      pluginModule = require(pluginName);
    } catch (err) {
      throw new Error(`Failed to load PostCSS plugin "${pluginName}": ${err.message}`);
    }
    pluginModule = (pluginModule && pluginModule.default) || pluginModule;
    return pluginOptions !== undefined ? pluginModule(pluginOptions) : pluginModule();
  });
}

function configurePostCSS(config = {}) {
  const env = process.env.NODE_ENV || 'development';
  const defaultPlugins = [
    'postcss-import',
    'postcss-nested',
    ['autoprefixer', {}]
  ];
  if (env === 'production') {
    defaultPlugins.push(['cssnano', { preset: 'default' }]);
  }
  const pluginSpecs = Array.isArray(config.plugins) ? config.plugins : defaultPlugins;
  const plugins = loadPostCSSPlugins(pluginSpecs);
  const result = { plugins };
  for (const key in config) {
    if (key !== 'plugins') {
      result[key] = config[key];
    }
  }
  return result;
}

module.exports = configurePostCSS;