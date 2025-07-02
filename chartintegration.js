function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

function deepMerge(target, source) {
  const output = { ...target }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        output[key] = source[key]
      }
    })
  }
  return output
}

export function initCharts(canvasId, config) {
  if (!canvasId || typeof canvasId !== 'string') {
    throw new Error('initCharts requires a valid canvasId string.')
  }
  if (!config || typeof config !== 'object') {
    throw new Error('initCharts requires a valid config object.')
  }
  const canvas = document.getElementById(canvasId)
  if (!canvas) {
    throw new Error(`Canvas element with id "${canvasId}" not found.`)
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error(`Failed to get 2D context for canvas "${canvasId}".`)
  }
  const type = config.type || 'line'
  if (config.type && typeof config.type !== 'string') {
    throw new Error('config.type must be a string.')
  }
  const defaultOptions = { responsive: true, maintainAspectRatio: false }
  const options = config.options
    ? deepMerge(defaultOptions, config.options)
    : defaultOptions
  const labels = config.data?.labels
  if (labels !== undefined && !Array.isArray(labels)) {
    throw new Error('config.data.labels must be an array.')
  }
  const datasets = config.data?.datasets
  if (datasets !== undefined && !Array.isArray(datasets)) {
    throw new Error('config.data.datasets must be an array.')
  }
  const chartConfig = {
    type,
    data: {
      labels: labels || [],
      datasets: datasets || []
    },
    options
  }
  return new Chart(ctx, chartConfig)
}

export function updateChart(chartInstance, data = {}) {
  if (!chartInstance || typeof chartInstance.update !== 'function') {
    throw new Error('updateChart requires a valid Chart.js instance.')
  }
  if (!data || typeof data !== 'object') {
    throw new Error('updateChart requires a data object.')
  }
  const chartData = chartInstance.data || {}
  if (data.labels !== undefined) {
    if (!Array.isArray(data.labels)) {
      throw new Error('data.labels must be an array.')
    }
    chartData.labels = data.labels
  }
  if (data.datasets !== undefined) {
    if (!Array.isArray(data.datasets)) {
      throw new Error('data.datasets must be an array.')
    }
    chartData.datasets = data.datasets
  }
  if (data.data !== undefined) {
    const ds = chartData.datasets || []
    if (data.datasetIndex !== undefined) {
      const idx = Number(data.datasetIndex)
      if (isNaN(idx) || idx < 0 || idx >= ds.length) {
        throw new Error('data.datasetIndex is out of range.')
      }
      if (!Array.isArray(data.data)) {
        throw new Error('data.data must be an array when using data.datasetIndex.')
      }
      ds[idx].data = data.data
    } else if (Array.isArray(data.data) && data.data.every(Array.isArray)) {
      data.data.forEach((arr, i) => {
        if (ds[i]) {
          ds[i].data = arr
        }
      })
    } else if (Array.isArray(data.data)) {
      if (!ds[0]) {
        throw new Error('No dataset found to update.')
      }
      ds[0].data = data.data
    } else if (isObject(data.data)) {
      Object.keys(data.data).forEach(key => {
        const value = data.data[key]
        if (!Array.isArray(value)) return
        const idx = Number(key)
        if (!isNaN(idx) && ds[idx]) {
          ds[idx].data = value
        } else {
          const found = ds.find(d => d.id === key || d.label === key)
          if (found) {
            found.data = value
          }
        }
      })
    } else {
      throw new Error('data.data must be an array or object.')
    }
  }
  if (data.options !== undefined) {
    if (!isObject(data.options)) {
      throw new Error('data.options must be an object.')
    }
    chartInstance.options = deepMerge(chartInstance.options || {}, data.options)
  }
  chartInstance.update()
  return chartInstance
}