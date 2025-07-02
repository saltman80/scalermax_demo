const MODEL_SELECTION = Object.assign(Object.create(null), {
  default: {
    provider: process.env.DEFAULT_PROVIDER ?? 'openai',
    model: process.env.DEFAULT_MODEL ?? 'gpt-3.5-turbo'
  },
  code: {
    provider: process.env.CODE_PROVIDER ?? 'openai',
    model: process.env.CODE_MODEL ?? 'gpt-4'
  },
  summarization: {
    provider: process.env.SUMMARIZATION_PROVIDER ?? 'openai',
    model: process.env.SUMMARIZATION_MODEL ?? 'gpt-3.5-turbo'
  },
  translation: {
    provider: process.env.TRANSLATION_PROVIDER ?? 'openai',
    model: process.env.TRANSLATION_MODEL ?? 'gpt-3.5-turbo'
  },
  analysis: {
    provider: process.env.ANALYSIS_PROVIDER ?? 'openai',
    model: process.env.ANALYSIS_MODEL ?? 'gpt-4'
  },
  creative: {
    provider: process.env.CREATIVE_PROVIDER ?? 'openai',
    model: process.env.CREATIVE_MODEL ?? 'gpt-4'
  },
  embeddings: {
    provider: process.env.EMBEDDINGS_PROVIDER ?? 'openai',
    model: process.env.EMBEDDINGS_MODEL ?? 'text-embedding-ada-002'
  }
});

function selectModel(intent) {
  let key = 'default';
  if (typeof intent === 'string') {
    key = intent.trim().toLowerCase();
  }
  if (!Object.prototype.hasOwnProperty.call(MODEL_SELECTION, key)) {
    key = 'default';
  }
  return { ...MODEL_SELECTION[key] };
}

module.exports = { selectModel };