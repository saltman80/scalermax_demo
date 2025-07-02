const fs = require('fs').promises;
const path = require('path');
const tf = require('@tensorflow/tfjs-node');
const { pathToFileURL } = require('url');

const MODEL_PATH = path.join(__dirname, 'models', 'model.json');
const TOKENIZER_PATH = path.join(__dirname, 'models', 'tokenizer.json');
const LABELS_PATH = path.join(__dirname, 'models', 'labels.json');
const MAX_SEQUENCE_LENGTH = 50;
const PADDING_INDEX = 0;
const OOV_INDEX = 1;

let modelInstance = null;
let modelPromise = null;
let wordIndex = null;
let wordIndexPromise = null;
let labels = null;
let labelsPromise = null;

async function loadModel() {
  if (modelInstance) {
    return modelInstance;
  }
  if (!modelPromise) {
    const fileUrl = pathToFileURL(MODEL_PATH).href;
    modelPromise = tf.loadLayersModel(fileUrl).then(m => {
      modelInstance = m;
      return m;
    });
  }
  return modelPromise;
}

async function loadWordIndex() {
  if (wordIndex) {
    return wordIndex;
  }
  if (!wordIndexPromise) {
    wordIndexPromise = fs.readFile(TOKENIZER_PATH, 'utf8').then(data => {
      wordIndex = JSON.parse(data);
      return wordIndex;
    });
  }
  return wordIndexPromise;
}

async function loadLabels() {
  if (labels) {
    return labels;
  }
  if (!labelsPromise) {
    labelsPromise = fs.readFile(LABELS_PATH, 'utf8').then(data => {
      labels = JSON.parse(data);
      return labels;
    });
  }
  return labelsPromise;
}

function preprocessText(text, wordIndexMap) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const sequence = tokens.map(token =>
    wordIndexMap[token] !== undefined ? wordIndexMap[token] : OOV_INDEX
  );
  if (sequence.length > MAX_SEQUENCE_LENGTH) {
    sequence.splice(0, sequence.length - MAX_SEQUENCE_LENGTH);
  }
  while (sequence.length < MAX_SEQUENCE_LENGTH) {
    sequence.unshift(PADDING_INDEX);
  }
  return tf.tensor2d([sequence], [1, MAX_SEQUENCE_LENGTH], 'int32');
}

async function classifyIntent(prompt) {
  if (typeof prompt !== 'string') {
    throw new TypeError('Prompt must be a string');
  }
  const [model, idx, lbls] = await Promise.all([
    loadModel(),
    loadWordIndex(),
    loadLabels()
  ]);
  const inputTensor = preprocessText(prompt, idx);
  const outputTensor = model.predict(inputTensor);
  const probabilities = await outputTensor.data();
  outputTensor.dispose();
  inputTensor.dispose();
  let maxIdx = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[maxIdx]) {
      maxIdx = i;
    }
  }
  return {
    intent: lbls[maxIdx] || 'unknown',
    confidence: probabilities[maxIdx]
  };
}

module.exports = { classifyIntent };