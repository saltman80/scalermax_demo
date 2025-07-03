// Re-export the main handler implemented at the project root
const { handler } = require('../../scalermax-api.js');
exports.handler = handler;
