// config/mollieConfig.js

require('dotenv').config();
const { createMollieClient } = require('@mollie/api-client');

if (!process.env.MOLLIE_API_KEY) {
  console.error('MOLLIE_API_KEY is niet ingesteld in de omgevingsvariabelen.');
  process.exit(1);
}

const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

module.exports = mollieClient;