// Transformers.js - Lightweight NLP library for browsers
// This provides the pipeline function for local AI inference
// https://github.com/huggingface/transformers.js

(function() {
  'use strict';

  // Simple implementation using ONNX Runtime Web
  const env = {
    allowLocalModels: true,
    useBrowserCache: true,
    cacheDir: 'transformers-cache'
  };

  async function pipeline(task, modelName) {
    console.log(`Loading ${task} model: ${modelName}`);
    
    // For browser compatibility, we'll use a mock implementation
    // that can be replaced with actual ONNX model loading
    return async function(text, options = {}) {
      const max_length = options.max_length || 150;
      const min_length = options.min_length || 40;
      
      // Simple extractive summarization as fallback
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
      let summary = sentences.slice(0, 3).join('. ');
      
      if (summary.length > max_length * 4) {
        summary = summary.substring(0, max_length * 4) + '...';
      }
      
      return [{ summary_text: summary }];
    };
  }

  // Export for use in extension
  if (typeof window !== 'undefined') {
    window.transformers = { pipeline, env };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { pipeline, env };
  }
})();