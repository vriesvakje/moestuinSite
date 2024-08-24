const express = require('express');
const router = express.Router();
const { sendNotificationEmail } = require('../emailService');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

// Hulpfuncties
const renderPage = (res, page, options) => {
  res.render(page, { ...options, user: options.user, csrfToken: options.csrfToken });
};

const handleError = (req, res, error, redirectPath) => {
  console.error(`Error: ${error.message}`, error);
  req.flash('error', 'Er is een fout opgetreden. Probeer het later opnieuw.');
  res.redirect(redirectPath);
};

// Huren pagina route
router.get('/', csrfProtection, (req, res) => {
  renderPage(res, 'huren', { 
    title: 'Huur een Moestuin', 
    user: req.user, 
    csrfToken: req.csrfToken() 
  });
});

// Huur aanvraag verwerking
router.post('/', csrfProtection, async (req, res) => {
  try {
    await sendNotificationEmail(req.body);
    renderPage(res, 'huren-bevestiging', { 
      title: 'Aanvraag Ontvangen', 
      user: req.user, 
      csrfToken: req.csrfToken() 
    });
  } catch (error) {
    handleError(req, res, error, '/huren');
  }
});

// Beschikbare moestuinen route
router.get('/beschikbaar', csrfProtection, (req, res) => {
  renderPage(res, 'beschikbaar', { 
    title: 'Beschikbare Moestuinen', 
    user: req.user, 
    csrfToken: req.csrfToken() 
  });
});

module.exports = router;