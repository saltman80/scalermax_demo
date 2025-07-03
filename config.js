const fs = require('fs')
const path = require('path')
const { URL } = require('url')

let dotenv
try {
  dotenv = require('dotenv')
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') throw err
}
if (dotenv) {
  const result = dotenv.config()
  if (result.error) {
    console.error('Error loading .env file:', result.error)
    throw result.error
  }
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Missing OPENROUTER_API_KEY in environment')
  throw new Error('FATAL: OPENROUTER_API_KEY is missing in environment.')
}
if (!process.env.SCALERMAX_BACKEND_KEY) {
  console.error('❌ Missing SCALERMAX_BACKEND_KEY in environment, using default')
  process.env.SCALERMAX_BACKEND_KEY = 'xyz789-scalermax-secret'
}

if (!process.env.OPENROUTER_BASE_URL) {
  process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
}

function getConfig() {
  let port = parseInt(process.env.PORT, 10)
  if (isNaN(port) || port <= 0) {
    port = 3000
  }

  const nodeEnv = process.env.NODE_ENV || 'production'
  const logLevel = process.env.LOG_LEVEL || 'info'

  const openRouter = {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  }

  const thresholdEnv = process.env.CLASSIFIER_THRESHOLD
  let threshold = parseFloat(thresholdEnv)
  if (isNaN(threshold)) {
    threshold = 0.5
  }

  const classifier = {
    modelPath: process.env.CLASSIFIER_MODEL_PATH || path.resolve(__dirname, 'models', 'classifier.onnx'),
    threshold
  }

  const dashboard = {
    metricsFile: process.env.METRICS_FILE || path.resolve(__dirname, 'data', 'metrics.json')
  }

  const config = { port, nodeEnv, logLevel, openRouter, classifier, dashboard }

  // Ensure metrics directory exists
  const metricsDir = path.dirname(config.dashboard.metricsFile)
  try {
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true })
    }
  } catch (err) {
    throw new Error(`Failed to create metrics directory at path: ${metricsDir}, error: ${err.message}`)
  }

  validateConfig(config)
  return config
}

function validateConfig(config) {
  const errors = []

  if (!config.openRouter.apiKey) {
    errors.push('OPENROUTER_API_KEY is required')
  }

  try {
    new URL(config.openRouter.baseUrl)
  } catch {
    errors.push('OPENROUTER_BASE_URL must be a valid URL')
  }

  if (!fs.existsSync(config.classifier.modelPath)) {
    errors.push(`Classifier model file not found at path: ${config.classifier.modelPath}`)
  }

  if (
    typeof config.classifier.threshold !== 'number' ||
    isNaN(config.classifier.threshold) ||
    config.classifier.threshold < 0 ||
    config.classifier.threshold > 1
  ) {
    errors.push('CLASSIFIER_THRESHOLD must be a number between 0 and 1')
  }

  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    errors.push('NODE_ENV must be one of development, production, test')
  }

  if (!Number.isInteger(config.port) || config.port <= 0) {
    errors.push('PORT must be a positive integer')
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    errors.push('LOG_LEVEL must be one of debug, info, warn, error')
  }

  if (errors.length) {
    throw new Error(`Configuration validation error(s): ${errors.join('; ')}`)
  }
}

module.exports = { getConfig, validateConfig }