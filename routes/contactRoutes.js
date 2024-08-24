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

// Contact pagina route
router.get('/', csrfProtection, (req, res) => {
  renderPage(res, 'contact', { 
    title: 'Neem Contact Op', 
    user: req.user, 
    csrfToken: req.csrfToken() 
  });
});

// Contact formulier verwerking
router.post('/', csrfProtection, async (req, res) => {
  try {
    await sendNotificationEmail(req.body);
    renderPage(res, 'contact-bevestiging', { 
      title: 'Bericht Ontvangen', 
      user: req.user, 
      csrfToken: req.csrfToken() 
    });
  } catch (error) {
    handleError(req, res, error, '/contact');
  }
});

module.exports = router;