const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 5, // Limiet elke IP tot 5 login requests per `window` per 15 minuten
  message: 'Te veel login pogingen vanaf dit IP, probeer het over 15 minuten opnieuw',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { loginLimiter };